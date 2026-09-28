import { createClient } from '@supabase/supabase-js'
import { sendTransactionalEmail, getMailConfig } from '../../../utils/mail'

/**
 * Recuperación de contraseña vía nuestro SMTP (Gmail),
 * evitando el rate limit del mailer built-in de Supabase (~2/hora).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = String(body?.email || '').trim().toLowerCase()

  // Respuesta uniforme (no filtrar si el mail existe).
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

  // Usuario inexistente: no revelar; igual "ok".
  if (error || !data?.properties?.hashed_token) {
    return ok
  }

  const token = data.properties.hashed_token
  const resetUrl = `${site}/campus/restablecer-contrasena#recovery_token=${token}`

  try {
    await sendTransactionalEmail({
      to: email,
      subject: 'Restablecer contraseña — Campus Emerge',
      text: `Pediste restablecer tu contraseña del Campus Emerge.\n\nAbrí este enlace (válido por un tiempo limitado):\n${resetUrl}\n\nSi no fuiste vos, ignorá este correo.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0d2c54;max-width:560px">
          <p style="margin:0 0 12px">Pediste restablecer tu contraseña del <strong>Campus Emerge</strong>.</p>
          <p style="margin:0 0 18px">
            <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700">
              Definir nueva contraseña
            </a>
          </p>
          <p style="margin:0;font-size:13px;color:#5b6b7c">Si no fuiste vos, ignorá este correo.</p>
        </div>
      `,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo enviar el correo'
    throw createError({ statusCode: 502, statusMessage: message })
  }

  return ok
})
