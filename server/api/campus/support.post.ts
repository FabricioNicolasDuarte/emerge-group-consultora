import { serverSupabaseUser } from '#supabase/server'
import { getMailConfig, sendTransactionalEmail } from '../../../utils/mail'

type SupportBody = {
  subject?: string
  message?: string
  pagePath?: string
  pageTitle?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
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

  const safeSubject = `[Soporte Campus] ${subject}`.slice(0, 180)
  const text = [
    'Soporte técnico Campus Emerge',
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
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0d2c54;max-width:640px">
        <p style="margin:0 0 8px"><strong>Soporte técnico — Campus Emerge</strong></p>
        <p style="margin:0 0 8px"><strong>De:</strong> ${escapeHtml(fromUser)}</p>
        ${pagePath ? `<p style="margin:0 0 8px"><strong>Página:</strong> ${escapeHtml(pageTitle || '')} <code>${escapeHtml(pagePath)}</code></p>` : ''}
        <p style="margin:16px 0 0;white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    `,
  })

  return { sent: true as const }
})
