import { serverSupabaseUser } from '#supabase/server'
import { getMailConfig, sendTransactionalEmail } from '../../utils/mail'
import {
  EMAIL_BRAND,
  brandedSubject,
  escapeEmailHtml,
  renderBrandedEmail,
} from '../../utils/email-brand'

type SupportBody = {
  subject?: string
  message?: string
  pagePath?: string
  pageTitle?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SupportBody>(event)
  const subject = String(body?.subject || '').trim()
  const message = String(body?.message || '').trim()
  const pagePath = String(body?.pagePath || '').trim()
  const pageTitle = String(body?.pageTitle || '').trim()

  if (subject.length < 4) {
    throw createError({ statusCode: 400, statusMessage: 'Indicá un asunto breve.' })
  }
  if (message.length < 20) {
    throw createError({ statusCode: 400, statusMessage: 'Describí el problema con un poco más de detalle.' })
  }
  if (message.length > 4000) {
    throw createError({ statusCode: 400, statusMessage: 'El mensaje es demasiado largo.' })
  }

  const config = getMailConfig()
  if (!config.enabled) {
    throw createError({
      statusCode: 503,
      statusMessage: 'El soporte por correo no está configurado en el servidor.',
    })
  }

  const supportTo =
    process.env.SUPPORT_EMAIL
    || config.smtp.fromEmail
    || config.smtp.user

  if (!supportTo) {
    throw createError({ statusCode: 503, statusMessage: 'Falta destinatario de soporte.' })
  }

  let fromUser = 'usuario-no-autenticado'
  let replyTo: string | undefined
  try {
    const claims = await serverSupabaseUser(event) as Record<string, unknown> | null
    const email = typeof claims?.email === 'string' ? claims.email : ''
    if (email) {
      fromUser = email
      replyTo = email
    }
  } catch {
    // optional auth context
  }

  const safeSubject = brandedSubject(`Soporte · ${subject}`).slice(0, 180)
  const text = [
    `Soporte técnico — ${EMAIL_BRAND.product}`,
    `De: ${fromUser}`,
    pagePath ? `Página: ${pageTitle || ''} ${pagePath}`.trim() : '',
    '',
    message,
  ].filter(Boolean).join('\n')

  await sendTransactionalEmail({
    to: supportTo,
    replyTo,
    subject: safeSubject,
    text,
    html: renderBrandedEmail({
      title: 'Solicitud de soporte técnico',
      bodyHtml: `
        <p style="margin:0 0 8px"><strong>De:</strong> ${escapeEmailHtml(fromUser)}</p>
        ${pagePath
          ? `<p style="margin:0 0 8px"><strong>Página:</strong> ${escapeEmailHtml(pageTitle || '')} <code style="font-size:13px">${escapeEmailHtml(pagePath)}</code></p>`
          : ''}
        <p style="margin:16px 0 0;white-space:pre-wrap">${escapeEmailHtml(message)}</p>
      `,
      signOff: EMAIL_BRAND.product,
      footerNote: `${EMAIL_BRAND.name} · Ticket generado desde la plataforma.`,
    }),
  })

  return { sent: true as const }
})
