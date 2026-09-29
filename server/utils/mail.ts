import nodemailer from 'nodemailer'

export type MailTransport = 'smtp' | 'resend' | 'none'

/**
 * Preferencia: Gmail/SMTP (gratis, a cualquier destinatario) → Resend (solo útil con dominio verificado).
 */
export function getMailConfig() {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || ''
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || ''
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = Number(process.env.SMTP_PORT || '465')
  const smtpFrom = process.env.SMTP_FROM || process.env.MAIL_FROM || smtpUser

  const resendKey = process.env.RESEND_API_KEY || ''
  const resendFrom = process.env.RESEND_FROM || ''

  const siteUrl = (
    process.env.NUXT_PUBLIC_SITE_URL
    || process.env.NUXT_PUBLIC_APP_URL
    || process.env.SITE_URL
    || 'https://emerge-group-consultora.vercel.app'
  ).replace(/\/$/, '')

  const smtpReady = Boolean(smtpUser && smtpPass)
  const resendReady = Boolean(resendKey && resendFrom)

  let transport: MailTransport = 'none'
  if (smtpReady) transport = 'smtp'
  else if (resendReady) transport = 'resend'

  const fromEmail = extractEmailAddress(smtpFrom) || smtpUser

  return {
    enabled: transport !== 'none',
    transport,
    siteUrl,
    smtp: {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom.includes('<')
        ? smtpFrom
        : `Emerge Group · Campus <${smtpFrom}>`,
      fromEmail,
    },
    resend: {
      apiKey: resendKey,
      from: resendFrom,
    },
    imap: {
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: Number(process.env.IMAP_PORT || '993'),
      user: process.env.IMAP_USER || smtpUser,
      pass: process.env.IMAP_PASS || smtpPass,
    },
  }
}

export function extractEmailAddress(value: string): string {
  const match = String(value || '').match(/<([^>]+)>/)
  return (match?.[1] || value || '').trim().toLowerCase()
}

/** Reply-To con plus-addressing para recuperar el thread al responder. */
export function buildCampusReplyTo(threadId: string): string | null {
  const config = getMailConfig()
  const base = config.smtp.fromEmail
  if (!base || !base.includes('@')) return null
  const [local, domain] = base.split('@')
  if (!local || !domain) return null
  const token = threadId.replace(/[^a-zA-Z0-9-]/g, '')
  return `${local}+campus.${token}@${domain}`
}

export function extractThreadIdFromAddress(address: string): string | null {
  const email = extractEmailAddress(address)
  const match = email.match(/\+campus\.([0-9a-f-]{36})@/i)
  return match?.[1]?.toLowerCase() || null
}

export function extractThreadIdFromSubject(subject: string): string | null {
  const match = String(subject || '').match(/#([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  return match?.[1]?.toLowerCase() || null
}

export function stripQuotedEmailReply(text: string): string {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n')
  const kept: string[] = []
  for (const line of lines) {
    if (/^On .+ wrote:\s*$/i.test(line)) break
    if (/^El .+ escribió:\s*$/i.test(line)) break
    if (/^-{2,}\s*Original Message/i.test(line)) break
    if (/^_{2,}\s*$/.test(line)) break
    if (/^From:\s.+/i.test(line) && kept.length > 0) break
    if (/^>/.test(line)) continue
    kept.push(line)
  }
  return kept.join('\n').trim()
}

export async function sendTransactionalEmail(input: {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  headers?: Record<string, string>
}) {
  const config = getMailConfig()
  if (!config.enabled) {
    return { sent: false as const, reason: 'mail_not_configured', transport: 'none' as const }
  }

  if (config.transport === 'smtp') {
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    })

    await transporter.sendMail({
      from: config.smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
      headers: input.headers,
    })

    return { sent: true as const, transport: 'smtp' as const }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.resend.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
      headers: input.headers,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw createError({
      statusCode: 502,
      statusMessage: `No se pudo enviar el correo (${res.status}): ${detail.slice(0, 200)}`,
    })
  }

  return { sent: true as const, transport: 'resend' as const }
}
