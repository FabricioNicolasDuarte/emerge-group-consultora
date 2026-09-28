import { readFileSync } from 'node:fs'
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
const admin = createClient(process.env.NUXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: listed, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (error) throw error

const user = (listed?.users || []).find((u) => (u.email || '').toLowerCase() === email)
if (!user) {
  console.log(JSON.stringify({ email, found: false }, null, 2))
  process.exit(0)
}

const { data: profile } = await admin.from('profiles').select('id, email, full_name, is_active').eq('id', user.id).maybeSingle()
const { data: roles } = await admin.from('user_roles').select('roles(slug,name)').eq('user_id', user.id)

console.log(JSON.stringify({
  found: true,
  id: user.id,
  email: user.email,
  confirmed: user.email_confirmed_at,
  lastSignIn: user.last_sign_in_at,
  profile,
  roles,
}, null, 2))
