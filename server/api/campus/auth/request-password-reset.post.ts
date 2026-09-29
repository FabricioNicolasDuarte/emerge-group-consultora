import { createClient } from '@supabase/supabase-js'
import { sendTransactionalEmail, getMailConfig } from '../../../utils/mail'
import {
  EMAIL_BRAND,
  brandedSubject,
  escapeEmailHtml,
  renderBrandedEmail,
} from '../../../utils/email-brand'

/**
 * Recuperación de contraseña vía SMTP propio (Gmail),
 * con marca Emerge Group — evita rate limit del mailer de Supabase.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = String(body?.email || '').trim().toLowerCase()

  const ok = { sent: true as const }

  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Correo inválido' })
  }

  const config = getMailConfig()
  if (!config.enabled) {
    throw createError({
      statusCode: 503,
      statusMessage: 'El envío de correo no está configurado en el servidor.',
    })
  }

  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const service =
    process.env.NUXT_SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    throw createError({ statusCode: 500, statusMessage: 'Falta configuración de Supabase' })
  }

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const site = config.siteUrl
  const redirectTo = `${site}/campus/restablecer-contrasena`

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (error || !data?.properties?.hashed_token) {
    return ok
  }

  const token = data.properties.hashed_token
  const resetUrl = `${site}/campus/restablecer-contrasena#recovery_token=${token}`

  const text = [
    `Pediste restablecer tu contraseña del ${EMAIL_BRAND.product} (${EMAIL_BRAND.name}).`,
    '',
    'Abrí este enlace (válido por un tiempo limitado):',
    resetUrl,
    '',
    'Si no fuiste vos, ignorá este correo. Tu contraseña actual no se modifica.',
    '',
    `— Equipo ${EMAIL_BRAND.product}`,
  ].join('\n')

  try {
    await sendTransactionalEmail({
      to: email,
      subject: brandedSubject('Restablecé tu contraseña'),
      text,
      html: renderBrandedEmail({
        title: 'Restablecer contraseña',
        bodyHtml: `
          <p style="margin:0 0 12px">Recibimos un pedido para cambiar la contraseña de tu cuenta en el <strong>${escapeEmailHtml(EMAIL_BRAND.product)}</strong>.</p>
          <p style="margin:0;color:${EMAIL_BRAND.muted};font-size:14px">Si no pediste este cambio, ignorá el mensaje. Tu contraseña actual no se modifica.</p>
        `,
        cta: { label: 'Definir nueva contraseña', url: resetUrl },
        footerNote: `${EMAIL_BRAND.name} · Enlace de un solo uso, con vencimiento corto.`,
      }),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo enviar el correo'
    throw createError({ statusCode: 502, statusMessage: message })
  }

  return ok
})
