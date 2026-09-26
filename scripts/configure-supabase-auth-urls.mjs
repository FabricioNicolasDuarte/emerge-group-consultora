/**
 * Configura Site URL + Redirect URLs de Auth en Supabase (Management API).
 *
 * Requiere token personal (NO es la service_role):
 *   https://supabase.com/dashboard/account/tokens
 *
 * En .env:
 *   SUPABASE_ACCESS_TOKEN=sbp_...
 *
 * Uso:
 *   node scripts/configure-supabase-auth-urls.mjs
 *   node scripts/configure-supabase-auth-urls.mjs --site=https://tu-dominio.com
 */
import { loadEnvFile } from './pg-connect.mjs'

loadEnvFile()

const PROJECT_REF = (() => {
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return m?.[1] || process.env.SUPABASE_PROJECT_REF || ''
})()

const siteArg = (process.argv.find((a) => a.startsWith('--site=')) || '').split('=')[1]
const SITE = (siteArg || process.env.NUXT_PUBLIC_APP_URL || 'https://emerge-group-consultora.vercel.app').replace(/\/$/, '')

const EXTRA = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  `${SITE}`,
  `${SITE}/**`,
  `${SITE}/campus/login`,
  `${SITE}/campus/dashboard`,
  `${SITE}/campus/registro`,
  `${SITE}/campus/restablecer-contrasena`,
]

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MANAGEMENT_TOKEN
  if (!token) {
    console.error(`
No puedo configurar Auth URLs solo con SUPABASE_SERVICE_ROLE_KEY.

Esa clave sirve para usuarios/datos, pero Site URL / Redirect URLs
se cambian con la Management API y un Access Token personal:

  1. Abrí https://supabase.com/dashboard/account/tokens
  2. Generate new token
  3. Pegalo en .env como:
       SUPABASE_ACCESS_TOKEN=sbp_xxxxx
  4. Volvé a correr:
       node scripts/configure-supabase-auth-urls.mjs

Mientras tanto, en el Dashboard:
  Authentication → URL Configuration
  Site URL: ${SITE}
  Redirect URLs: (una por línea)
${EXTRA.map((u) => `    ${u}`).join('\n')}
`)
    process.exit(1)
  }

  if (!PROJECT_REF) {
    console.error('No se pudo obtener project ref de NUXT_PUBLIC_SUPABASE_URL')
    process.exit(1)
  }

  const uri_allow_list = [...new Set(EXTRA)].join(',')

  console.log(`Proyecto: ${PROJECT_REF}`)
  console.log(`Site URL: ${SITE}`)
  console.log(`Redirects: ${uri_allow_list}\n`)

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      site_url: SITE,
      uri_allow_list,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('Error Management API:', res.status, text)
    process.exit(1)
  }

  console.log('✓ Auth URL Configuration actualizada.')
  try {
    const json = JSON.parse(text)
    console.log('  site_url:', json.site_url)
    console.log('  uri_allow_list:', json.uri_allow_list)
  } catch {
    console.log(text.slice(0, 400))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
