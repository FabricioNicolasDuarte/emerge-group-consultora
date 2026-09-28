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

  return {
    enabled: transport !== 'none',
    transport,
    siteUrl,
    smtp: {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom.includes('<') ? smtpFrom : `Campus Emerge <${smtpFrom}>`,
    },
    resend: {
      apiKey: resendKey,
      from: resendFrom,
    },
  }
}

export async function sendTransactionalEmail(input: {
  to: string
  subject: string
  html: string
  text?: string
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
