import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { resolveAuthUserId } from '../../../utils/campus-admin'
import {
  buildCampusReplyTo,
  getMailConfig,
  sendTransactionalEmail,
} from '../../../utils/mail'

export default defineEventHandler(async (event) => {
  const claims = await serverSupabaseUser(event) as Record<string, unknown> | null
  const callerId = resolveAuthUserId(claims)
  if (!callerId) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody<{
    recipient_id?: string
    subject?: string
    preview?: string
    thread_id?: string
  }>(event)

  const recipientId = String(body?.recipient_id || '').trim()
  const subject = String(body?.subject || '').trim()
  const preview = String(body?.preview || '').trim()
  const threadId = String(body?.thread_id || '').trim()

  if (!recipientId || !subject) {
    throw createError({ statusCode: 400, statusMessage: 'Faltan destinatario o asunto' })
  }

  const admin = serverSupabaseServiceRole(event)

  const [{ data: recipient }, { data: sender }] = await Promise.all([
    admin.from('profiles').select('id, email, full_name').eq('id', recipientId).maybeSingle(),
    admin.from('profiles').select('id, full_name, email').eq('id', callerId).maybeSingle(),
  ])

  if (!recipient?.email) {
    return { sent: false, reason: 'recipient_without_email' }
  }

  const config = getMailConfig()
  const inboxUrl = threadId
    ? `${config.siteUrl}/campus/buzon/${threadId}`
    : `${config.siteUrl}/campus/buzon`

  const senderName = sender?.full_name || 'Campus Emerge'
  const safePreview = preview.slice(0, 280) || 'Abrí el Campus para leer el mensaje completo.'
  const replyTo = threadId ? buildCampusReplyTo(threadId) : null
  const subjectLine = threadId
    ? `[Campus Emerge] ${subject} #${threadId}`
    : `[Campus Emerge] ${subject}`

  try {
    const result = await sendTransactionalEmail({
      to: recipient.email,
      subject: subjectLine,
      replyTo: replyTo || undefined,
      headers: threadId
        ? {
            'X-Campus-Thread-Id': threadId,
          }
        : undefined,
      text: `${senderName} te envió un mensaje en el Campus Emerge.\n\nAsunto: ${subject}\n\n${safePreview}\n\nPodés responder este correo y la respuesta llegará al Campus, o abrir tu buzón: ${inboxUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0d2c54;max-width:560px">
          <p style="margin:0 0 12px"><strong>${senderName}</strong> te envió un mensaje en el Campus Emerge.</p>
          <p style="margin:0 0 8px"><strong>Asunto:</strong> ${subject.replace(/</g, '&lt;')}</p>
          <p style="margin:0 0 18px;color:#5b6b7c">${safePreview.replace(/</g, '&lt;')}</p>
          <p style="margin:0 0 14px;font-size:13px;color:#5b6b7c">
            Podés <strong>responder este correo</strong> y tu respuesta llegará al buzón del Campus.
          </p>
          <p style="margin:0">
            <a href="${inboxUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700">
              Abrir buzón
            </a>
          </p>
        </div>
      `,
    })
    return result
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de correo'
    return { sent: false, reason: 'send_failed', message }
  }
})
