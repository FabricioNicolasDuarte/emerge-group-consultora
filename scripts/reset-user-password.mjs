import { readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
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

const email = (process.argv[2] || 'emergegroup.fsa@gmail.com').trim().toLowerCase()
const admin = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (listErr) throw listErr
const user = (list.users || []).find((u) => (u.email || '').toLowerCase() === email)
if (!user) {
  console.error(JSON.stringify({ found: false, email }))
  process.exit(1)
}

const pass = `EmergeTmp${randomBytes(4).toString('hex')}!`
const { error } = await admin.auth.admin.updateUserById(user.id, {
  password: pass,
  email_confirm: true,
})
if (error) throw error

const out = {
  email,
  id: user.id,
  temporary_password: pass,
  note: 'Cambiar al entrar. Generado ' + new Date().toISOString(),
}
writeFileSync(resolve('credentials/fsa-temp-password.local.json'), JSON.stringify(out, null, 2))
console.log(JSON.stringify(out, null, 2))
