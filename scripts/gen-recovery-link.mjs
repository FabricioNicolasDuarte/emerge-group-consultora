import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

loadEnv()

const url = process.env.NUXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = process.argv[2] || 'qa.perfil.docente@test.emerge.local'
const { data, error } = await admin.auth.admin.generateLink({
  type: 'recovery',
  email,
  options: { redirectTo: 'http://localhost:3000/campus/restablecer-contrasena' },
})
if (error) throw error

const out = {
  email,
  hashed_token: data.properties.hashed_token,
  action_link: data.properties.action_link,
  verify_url: `http://localhost:3000/campus/restablecer-contrasena#recovery_token=${data.properties.hashed_token}`,
}
writeFileSync(resolve('credentials/qa-recovery-link.local.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2))
