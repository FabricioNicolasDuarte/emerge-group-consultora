/**
 * Alta masiva de alumnos desde CSV local (no se sube a git).
 *
 * 1. Copiá credentials/alumnos.example.csv → credentials/alumnos.local.csv
 * 2. Completá filas (email, password, full_name, …)
 * 3. node scripts/provision-alumnos-from-csv.mjs
 *
 * Opcional: --course-slug=diplomatura-gestion-liderazgo para inscribirlos.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './pg-connect.mjs'
import { randomBytes } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const INPUT = resolve(ROOT, 'credentials/alumnos.local.csv')
const OUTPUT = resolve(ROOT, 'credentials/credenciales-generadas.local.csv')

loadEnvFile()

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'))
  if (!lines.length) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim() })
    return row
  })
}

function splitCsvLine(line) {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === ',' && !inQ) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

function genPassword() {
  return `Eg${randomBytes(4).toString('hex')}!${randomBytes(2).toString('hex')}`
}

function csvEscape(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function main() {
  if (!existsSync(INPUT)) {
    console.error(`\nNo existe ${INPUT}`)
    console.error('Copiá credentials/alumnos.example.csv → credentials/alumnos.local.csv y completá las filas.\n')
    process.exit(1)
  }

  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    console.error('Falta NUXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
    process.exit(1)
  }

  const courseSlug = (process.argv.find((a) => a.startsWith('--course-slug=')) || '').split('=')[1] || ''
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  let courseId = null
  if (courseSlug) {
    const { data: course, error } = await admin.from('courses').select('id, title').eq('slug', courseSlug).maybeSingle()
    if (error) {
      console.error(`Error al buscar curso: ${error.message}`)
      if (error.code === '42501') {
        console.error('Falta GRANT a service_role. Corré la migración 20260328000000_restore_service_role_grants.sql')
      }
      process.exit(1)
    }
    if (!course) {
      console.error(`Curso no encontrado: ${courseSlug}`)
      process.exit(1)
    }
    courseId = course.id
    console.log(`Inscribir en: ${course.title}`)
  }

  const rows = parseCsv(readFileSync(INPUT, 'utf8'))
  if (!rows.length) {
    console.error('CSV vacío')
    process.exit(1)
  }

  const results = []
  console.log(`\nProcesando ${rows.length} filas…\n`)

  for (const row of rows) {
    const email = (row.email || '').toLowerCase()
    const fullName = row.full_name || row.nombre || ''
    if (!email || !fullName) {
      results.push({ email, full_name: fullName, status: 'omitido', password: '', note: 'falta email o nombre' })
      continue
    }

    let password = row.password || row.contraseña || row.contrasena || ''
    const generated = !password
    if (!password) password = genPassword()

    const { data: existing } = await admin.from('profiles').select('id, email').eq('email', email).maybeSingle()

    let userId = existing?.id || null
    let created = false

    if (!userId) {
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (createError || !createdUser.user) {
        results.push({ email, full_name: fullName, status: 'error', password: '', note: createError?.message || 'createUser' })
        console.log(`✗ ${email}: ${createError?.message}`)
        continue
      }
      userId = createdUser.user.id
      created = true
    }

    await admin.from('profiles').update({
      full_name: fullName,
      email,
      phone: row.phone || row.telefono || null,
      city: row.city || row.ciudad || null,
      job_role: row.job_role || row.rol || null,
      occupation: row.occupation || row.ocupacion || null,
      audience: row.audience || null,
      challenge: row.challenge || row.desafio || null,
    }).eq('id', userId)

    let enrolled = false
    if (courseId) {
      const { error: enrErr } = await admin.from('enrollments').upsert({
        course_id: courseId,
        student_id: userId,
        status: 'active',
      }, { onConflict: 'course_id,student_id' })
      enrolled = !enrErr
    }

    results.push({
      email,
      full_name: fullName,
      status: created ? 'creado' : 'existente',
      password: created || generated ? password : '(ya tenía cuenta — password no regenerada)',
      note: enrolled ? 'inscrito' : (courseId ? 'sin inscripción' : ''),
    })
    console.log(`${created ? '✓' : '·'} ${fullName} <${email}>`)
  }

  mkdirSync(resolve(ROOT, 'credentials'), { recursive: true })
  const header = 'full_name,email,password,status,note'
  const body = results.map((r) =>
    [r.full_name, r.email, r.password, r.status, r.note].map(csvEscape).join(','),
  )
  writeFileSync(OUTPUT, [header, ...body].join('\n'), 'utf8')
  console.log(`\nCredenciales en: ${OUTPUT}`)
  console.log('Ese archivo está en .gitignore — no lo subas a git.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
