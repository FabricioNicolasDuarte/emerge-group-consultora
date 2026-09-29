import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { resolveAuthUserId } from '../../../utils/campus-admin'
import {
  buildCampusReplyTo,
  getMailConfig,
  sendTransactionalEmail,
} from '../../../utils/mail'
import {
  EMAIL_BRAND,
  brandedSubject,
  escapeEmailHtml,
  renderBrandedEmail,
} from '../../../utils/email-brand'

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

  const senderName = sender?.full_name || EMAIL_BRAND.product
  const safePreview = preview.slice(0, 280) || 'Abrí el Campus para leer el mensaje completo.'
  const replyTo = threadId ? buildCampusReplyTo(threadId) : null
  const subjectLine = threadId
    ? brandedSubject(`${subject} #${threadId}`)
    : brandedSubject(subject)

  const text = [
    `${senderName} te envió un mensaje en el ${EMAIL_BRAND.product} (${EMAIL_BRAND.name}).`,
    '',
    `Asunto: ${subject}`,
    '',
    safePreview,
    '',
    'Podés responder este correo y la respuesta llegará al Campus, o abrir tu buzón:',
    inboxUrl,
    '',
    `— Equipo ${EMAIL_BRAND.product}`,
  ].join('\n')

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
      text,
      html: renderBrandedEmail({
        title: 'Nuevo mensaje en tu buzón',
        bodyHtml: `
          <p style="margin:0 0 12px"><strong>${escapeEmailHtml(senderName)}</strong> te envió un mensaje.</p>
          <p style="margin:0 0 8px"><strong>Asunto:</strong> ${escapeEmailHtml(subject)}</p>
          <p style="margin:0 0 12px;color:${EMAIL_BRAND.muted}">${escapeEmailHtml(safePreview)}</p>
          <p style="margin:0;font-size:14px;color:${EMAIL_BRAND.muted}">
            Podés <strong>responder este correo</strong> y tu respuesta llegará al buzón del Campus.
          </p>
        `,
        cta: { label: 'Abrir buzón', url: inboxUrl },
        footerNote: `${EMAIL_BRAND.name} · Notificación del ${EMAIL_BRAND.product}.`,
      }),
    })
    return result
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de correo'
    return { sent: false, reason: 'send_failed', message }
  }
})
