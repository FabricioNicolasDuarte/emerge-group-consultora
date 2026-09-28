/**
 * QA: perfiles (foto) + cambio de contraseña (perfil y recovery).
 * Crea 3 usuarios nuevos con roles distintos y corre verificaciones.
 *
 * Uso: node scripts/qa-profile-password.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const anonKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.NUXT_PUBLIC_SUPABASE_KEY
  || process.env.SUPABASE_ANON_KEY
const siteOrigin = process.env.NUXT_PUBLIC_SITE_URL
  || process.env.NUXT_PUBLIC_APP_URL
  || 'https://emerge-group-consultora.vercel.app'

if (!url || !serviceKey || !anonKey) {
  console.error('Faltan SUPABASE URL / SERVICE_ROLE / ANON en .env')
  process.exit(1)
}

const INITIAL_PASSWORD = 'QaInitial2026!'
const PROFILE_PASSWORD = 'QaPerfil2026!'
const RESET_PASSWORD = 'QaReset2026!'

const USERS = [
  {
    email: 'qa.perfil.alumno@test.emerge.local',
    fullName: 'QA Perfil Alumna',
    role: 'alumno',
    color: [37, 99, 235],
  },
  {
    email: 'qa.perfil.docente@test.emerge.local',
    fullName: 'QA Perfil Docente',
    role: 'docente',
    color: [242, 140, 40],
  },
  {
    email: 'qa.perfil.admin@test.emerge.local',
    fullName: 'QA Perfil Superadmin',
    role: 'superadmin',
    color: [13, 44, 84],
  },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type)
  const payload = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(payload))
  return Buffer.concat([len, payload, crc])
}

/** Minimal valid 2x2 PNG with solid RGB. */
function makePng(r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const width = 2
  const height = 2
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const raw = Buffer.alloc((1 + width * 3) * height)
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3)
    raw[row] = 0
    for (let x = 0; x < width; x++) {
      const i = row + 1 + x * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

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
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw error
  return data.user.id
}

async function assignRole(admin, userId, roleSlug) {
  const { error } = await admin.rpc('dev_assign_campus_role', {
    p_user_id: userId,
    p_role_slug: roleSlug,
  })
  if (error) throw error
}

async function uploadAvatar(admin, userId, rgb) {
  const png = makePng(...rgb)
  const path = `${userId}/avatar.png`
  const { error: upErr } = await admin.storage.from('avatars').upload(path, png, {
    upsert: true,
    contentType: 'image/png',
    cacheControl: '3600',
  })
  if (upErr) throw upErr
  const { data } = admin.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`
  const { error: avErr } = await admin.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
  if (avErr) throw avErr
  return avatarUrl
}

async function testPasswordViaClient(email, oldPassword, newPassword) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signErr } = await client.auth.signInWithPassword({ email, password: oldPassword })
  if (signErr) throw new Error(`Login falló (${email}): ${signErr.message}`)
  const { error: updErr } = await client.auth.updateUser({ password: newPassword })
  if (updErr) throw new Error(`updateUser falló (${email}): ${updErr.message}`)
  await client.auth.signOut()

  const client2 = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: oldLoginErr } = await client2.auth.signInWithPassword({ email, password: oldPassword })
  if (!oldLoginErr) throw new Error(`La contraseña vieja sigue funcionando para ${email}`)
  const { error: newLoginErr } = await client2.auth.signInWithPassword({ email, password: newPassword })
  if (newLoginErr) throw new Error(`Login con nueva password falló (${email}): ${newLoginErr.message}`)
  await client2.auth.signOut()
}

async function testRecoveryFlow(admin, email, newPassword) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${siteOrigin}/campus/restablecer-contrasena`,
    },
  })
  if (error) throw error

  const actionLink = data.properties?.action_link
  const hashedToken = data.properties?.hashed_token
  if (!actionLink) throw new Error('generateLink no devolvió action_link')

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (!hashedToken) {
    return { actionLink, verified: false }
  }

  const { error: verifyErr } = await client.auth.verifyOtp({
    token_hash: hashedToken,
    type: 'recovery',
  })
  if (verifyErr) throw new Error(`verifyOtp recovery falló (${email}): ${verifyErr.message}`)

  const { error: updErr } = await client.auth.updateUser({ password: newPassword })
  if (updErr) throw new Error(`Recovery updateUser falló (${email}): ${updErr.message}`)
  await client.auth.signOut()

  const check = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: loginErr } = await check.auth.signInWithPassword({ email, password: newPassword })
  if (loginErr) throw new Error(`Login post-recovery falló (${email}): ${loginErr.message}`)
  await check.auth.signOut()
  return { actionLink, verified: true }
}

async function attachToDiplomatura(admin, studentId, teacherId) {
  const { data: course, error } = await admin
    .from('courses')
    .select('id, slug, title')
    .eq('slug', 'diplomatura-gestion-liderazgo')
    .maybeSingle()
  if (error) throw error
  if (!course) {
    console.warn('⚠ No se encontró diplomatura-gestion-liderazgo (skip enrollment)')
    return null
  }

  const { error: enrErr } = await admin.from('enrollments').upsert({
    course_id: course.id,
    student_id: studentId,
    status: 'active',
  }, { onConflict: 'course_id,student_id' })
  if (enrErr) {
    // fallback insert-ignore style
    const { data: existing } = await admin
      .from('enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', studentId)
      .maybeSingle()
    if (!existing) {
      const { error } = await admin.from('enrollments').insert({
        course_id: course.id,
        student_id: studentId,
        status: 'active',
      })
      if (error) throw error
    }
  }

  const { data: assignment } = await admin
    .from('course_assignments')
    .select('id')
    .eq('course_id', course.id)
    .eq('teacher_id', teacherId)
    .maybeSingle()
  if (!assignment) {
    const { error } = await admin.from('course_assignments').insert({
      course_id: course.id,
      teacher_id: teacherId,
      role: 'docente',
    })
    if (error) throw error
  }

  return course
}

async function verifyStaffSeesAvatars(admin, studentId, teacherId) {
  const { data: students, error: sErr } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', [studentId, teacherId])
  if (sErr) throw sErr
  for (const row of students) {
    if (!row.avatar_url) throw new Error(`Sin avatar_url en perfil ${row.full_name}`)
    const res = await fetch(row.avatar_url)
    if (!res.ok) throw new Error(`Avatar URL no accesible (${row.full_name}): ${res.status}`)
  }
  return students
}

async function main() {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n=== QA Perfil / Password / Avatares ===\n')

  const results = []

  for (const u of USERS) {
    const id = await ensureUser(admin, {
      email: u.email,
      password: INITIAL_PASSWORD,
      fullName: u.fullName,
    })
    await sleep(400)
    await assignRole(admin, id, u.role)
    // ensure profile name
    await admin.from('profiles').update({ full_name: u.fullName }).eq('id', id)
    const avatarUrl = await uploadAvatar(admin, id, u.color)
    results.push({ ...u, id, avatarUrl })
    console.log(`✓ creado/actualizado ${u.role.padEnd(11)} ${u.email}`)
    console.log(`  avatar: ${avatarUrl}`)
  }

  const alumno = results.find((r) => r.role === 'alumno')
  const docente = results.find((r) => r.role === 'docente')

  const course = await attachToDiplomatura(admin, alumno.id, docente.id)
  if (course) console.log(`✓ alumno+docente vinculados a ${course.title}`)

  console.log('\n-- Cambio de contraseña desde sesión (simula perfil) --')
  for (const u of results) {
    await testPasswordViaClient(u.email, INITIAL_PASSWORD, PROFILE_PASSWORD)
    console.log(`✓ perfil password OK ${u.role}`)
  }

  console.log('\n-- Restablecimiento (recovery link / verifyOtp) --')
  const recoveryLinks = []
  for (const u of results) {
    const out = await testRecoveryFlow(admin, u.email, RESET_PASSWORD)
    recoveryLinks.push({ email: u.email, role: u.role, ...out })
    console.log(`✓ recovery OK ${u.role} (verified=${out.verified})`)
  }

  console.log('\n-- Visibilidad de avatares --')
  const seen = await verifyStaffSeesAvatars(admin, alumno.id, docente.id)
  for (const row of seen) {
    console.log(`✓ foto accesible: ${row.full_name}`)
  }

  const teacherClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  await teacherClient.auth.signInWithPassword({
    email: docente.email,
    password: RESET_PASSWORD,
  })
  const { data: roster, error: rosterErr } = await teacherClient
    .from('enrollments')
    .select('student_id, profiles:student_id(id, full_name, avatar_url)')
    .eq('status', 'active')
    .limit(100)
  if (rosterErr) throw rosterErr
  const found = (roster || []).some((r) => r.profiles?.id === alumno.id && r.profiles?.avatar_url)
  if (!found) throw new Error('El docente no ve avatar_url del alumno en enrollments')
  console.log('✓ docente ve avatar del alumno vía RLS')
  await teacherClient.auth.signOut()

  const outDir = resolve(process.cwd(), 'credentials')
  mkdirSync(outDir, { recursive: true })
  const report = {
    generatedAt: new Date().toISOString(),
    passwords: {
      afterProfileChange: PROFILE_PASSWORD,
      afterRecovery: RESET_PASSWORD,
      note: 'Contraseña final vigente para los 3 usuarios QA = afterRecovery',
    },
    users: results.map((u) => ({
      role: u.role,
      email: u.email,
      id: u.id,
      avatarUrl: u.avatarUrl,
      passwordNow: RESET_PASSWORD,
    })),
    recoveryLinks: recoveryLinks.map((r) => ({
      email: r.email,
      role: r.role,
      verified: r.verified,
      actionLink: r.actionLink,
    })),
    course,
  }
  const reportPath = resolve(outDir, 'qa-perfil-password.local.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nReporte: ${reportPath}`)
  console.log('\nTodas las pruebas API pasaron.\n')
}

main().catch((err) => {
  console.error('\nFAIL:', err.message || err)
  process.exit(1)
})
