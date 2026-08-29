/**
 * Crea usuarios de prueba en Supabase Auth + asigna roles.
 * Requiere en .env: SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SERVICE_KEY

function assertServiceRoleKey(key) {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))
    if (payload.role !== 'service_role') {
      console.error('\nLa clave en SUPABASE_SERVICE_ROLE_KEY no es service_role.')
      console.error('Pegaste la anon key por error. En Supabase → API copiá "service_role" (secret).\n')
      process.exit(1)
    }
  } catch {
    console.error('\nSUPABASE_SERVICE_ROLE_KEY inválida.\n')
    process.exit(1)
  }
}

const TEST_USERS = [
  {
    email: 'campus.alumno@test.emerge.local',
    password: 'CampusEmerge2026!',
    fullName: 'Alumno Prueba Campus',
    role: 'alumno',
  },
  {
    email: 'campus.docente@test.emerge.local',
    password: 'CampusEmerge2026!',
    fullName: 'Docente Prueba Campus',
    role: 'docente',
  },
  {
    email: 'campus.admin@test.emerge.local',
    password: 'CampusEmerge2026!',
    fullName: 'Admin Prueba Campus',
    role: 'superadmin',
  },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function ensureUser(admin, { email, password, fullName }) {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) throw listErr

  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (error) throw error
    return { id: existing.id, created: false }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw error
  return { id: data.user.id, created: true }
}

async function assignRole(admin, userId, roleSlug) {
  const { error } = await admin.rpc('dev_assign_campus_role', {
    p_user_id: userId,
    p_role_slug: roleSlug,
  })
  if (error) {
    if (error.message.includes('dev_assign_campus_role')) {
      console.error('\nFalta la función dev_assign_campus_role en Supabase.')
      console.error('Ejecutá en SQL Editor: supabase/migrations/20260327200000_dev_seed_role_fn.sql')
      console.error('Luego volvé a correr: npm run seed:test-users\n')
    }
    throw error
  }
}

async function main() {
  if (!url || !serviceKey) {
    console.error('\nFalta SUPABASE_SERVICE_ROLE_KEY en .env\n')
    process.exit(1)
  }

  assertServiceRoleKey(serviceKey)

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\nCreando usuarios de prueba Campus Emerge...\n')

  const created = []

  for (const user of TEST_USERS) {
    const { id: userId, created: isNew } = await ensureUser(admin, user)
    if (isNew) await sleep(800)
    await assignRole(admin, userId, user.role)
    created.push({ ...user, id: userId })
    console.log(`✓ ${user.role.padEnd(11)} ${user.email}`)
  }

  const credsPath = resolve(process.cwd(), 'docs', 'USUARIOS-PRUEBA.md')
  const md = `# Usuarios de prueba — Campus Emerge (solo desarrollo)

Generados automáticamente. **No usar en producción.**

| Rol | Email | Contraseña | Panel |
|-----|-------|------------|-------|
| Alumno | campus.alumno@test.emerge.local | CampusEmerge2026! | /campus/student |
| Docente | campus.docente@test.emerge.local | CampusEmerge2026! | /campus/teacher |
| Superadmin | campus.admin@test.emerge.local | CampusEmerge2026! | /campus/admin |

Login: http://localhost:3000/campus/login

## IDs (referencia)

${created.map((u) => `- **${u.role}**: \`${u.id}\``).join('\n')}

Para regenerar: \`npm run seed:test-users\`
`

  writeFileSync(credsPath, md, 'utf8')
  console.log(`\nCredenciales guardadas en docs/USUARIOS-PRUEBA.md\n`)
}

main().catch((err) => {
  console.error('\nError:', err.message || err)
  process.exit(1)
})
