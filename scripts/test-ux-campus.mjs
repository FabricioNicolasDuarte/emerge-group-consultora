/**
 * Tests UX campus: videos helpers + permisos docente (contenido / borradores / asistencia).
 * Uso: npm run test:ux
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  try {
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
  } catch { /* noop */ }
}

loadEnv()

const results = []
function pass(name, detail = '') {
  results.push({ ok: true, name, detail })
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
}
function fail(name, detail = '') {
  results.push({ ok: false, name, detail })
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

function loadVideoUtils() {
  const jiti = require('jiti')(import.meta.url, { interopDefault: true })
  return jiti(resolve(process.cwd(), 'app/utils/video.ts'))
}

async function testVideoHelpers() {
  let utils
  try {
    utils = loadVideoUtils()
  } catch (e) {
    fail('Cargar video.ts', e.message)
    return
  }

  const { parseVideoUrl, videoUrlHint, isRecognizedVideoUrl } = utils

  const yt = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  if (yt.kind === 'youtube') pass('parse YouTube', yt.videoId)
  else fail('parse YouTube', JSON.stringify(yt))

  const drive = parseVideoUrl('https://drive.google.com/file/d/abc123XYZ/view')
  if (drive.kind === 'drive' && drive.fileId === 'abc123XYZ') pass('parse Drive', drive.fileId)
  else fail('parse Drive', JSON.stringify(drive))

  const hint = videoUrlHint('https://drive.google.com/file/d/abc/view')
  if (hint && /Cualquiera con el enlace/i.test(hint)) pass('hint Drive compartir')
  else fail('hint Drive compartir', String(hint))

  if (isRecognizedVideoUrl('https://youtu.be/dQw4w9WgXcQ')) pass('isRecognizedVideoUrl youtube')
  else fail('isRecognizedVideoUrl youtube')

  if (!isRecognizedVideoUrl('nota sin url')) pass('rechaza texto no-url')
  else fail('rechaza texto no-url')
}

async function login(email, password) {
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY
  if (!url || !anonKey) throw new Error('Faltan NUXT_PUBLIC_SUPABASE_URL / KEY en .env')
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Login ${email}: ${error.message}`)
  return { client, user: data.user }
}

async function testTeacherContentPermissions() {
  const docente = {
    email: process.env.TEST_CAMPUS_DOCENTE_EMAIL || 'campus.docente@test.emerge.local',
    password: process.env.TEST_CAMPUS_DOCENTE_PASSWORD || 'CampusEmerge2026!',
  }
  const alumno = {
    email: process.env.TEST_CAMPUS_EMAIL || 'campus.alumno@test.emerge.local',
    password: process.env.TEST_CAMPUS_PASSWORD || 'CampusEmerge2026!',
  }

  let teacher
  try {
    teacher = await login(docente.email, docente.password)
    pass('Login docente')
  } catch (e) {
    fail('Login docente', e.message)
    return
  }

  const { data: teaching, error: tErr } = await teacher.client
    .from('my_teaching_courses')
    .select('*')
    .limit(1)

  if (tErr) {
    fail('my_teaching_courses', tErr.message)
    return
  }
  if (!teaching?.length) {
    fail('Docente sin curso asignado', 'Asigná el docente de prueba a un curso')
    return
  }

  const courseId = teaching[0].course_id
  pass('Docente tiene curso', teaching[0].title || courseId)

  let student
  try {
    student = await login(alumno.email, alumno.password)
    pass('Login alumno')
  } catch (e) {
    fail('Login alumno', e.message)
  }

  if (student) {
    const { error: enrErr } = await teacher.client.from('enrollments').upsert(
      {
        course_id: courseId,
        student_id: student.user.id,
        status: 'active',
      },
      { onConflict: 'course_id,student_id' },
    )
    if (enrErr) {
      // Docente puede no tener permiso de enroll — intentar admin
      try {
        const admin = await login(
          process.env.TEST_CAMPUS_STAFF_EMAIL || 'campus.admin@test.emerge.local',
          process.env.TEST_CAMPUS_STAFF_PASSWORD || 'CampusEmerge2026!',
        )
        const { error: aErr } = await admin.client.from('enrollments').upsert(
          {
            course_id: courseId,
            student_id: student.user.id,
            status: 'active',
          },
          { onConflict: 'course_id,student_id' },
        )
        if (aErr) fail('Asegurar inscripción alumno', aErr.message)
        else pass('Inscripción alumno asegurada (admin)')
      } catch (e) {
        fail('Asegurar inscripción alumno', e.message)
      }
    } else {
      pass('Inscripción alumno asegurada')
    }
  }

  const { data: modules, error: mErr } = await teacher.client
    .from('modules')
    .select('id, title')
    .eq('course_id', courseId)
    .order('sort_order')
    .limit(1)

  if (mErr || !modules?.length) {
    // Crear módulo
    const { data: createdMod, error: cmErr } = await teacher.client
      .from('modules')
      .insert({ course_id: courseId, title: `UX test módulo ${Date.now()}`, sort_order: 99 })
      .select()
      .single()
    if (cmErr) {
      fail('Docente crea módulo', cmErr.message)
      return
    }
    pass('Docente crea módulo', createdMod.id)
    modules.push(createdMod)
  } else {
    pass('Módulo existente', modules[0].id)
  }

  const moduleId = modules[0].id
  const stamp = Date.now()
  const { data: lesson, error: lErr } = await teacher.client
    .from('lessons')
    .insert({
      module_id: moduleId,
      title: `UX test clase ${stamp}`,
      content_type: 'video',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      sort_order: 999,
      is_published: false,
    })
    .select()
    .single()

  if (lErr) {
    fail('Docente crea clase (RLS)', lErr.message)
    return
  }
  pass('Docente crea clase borrador', lesson.id)

  const { data: updated, error: uErr } = await teacher.client
    .from('lessons')
    .update({ is_published: true, title: `UX test clase publicada ${stamp}` })
    .eq('id', lesson.id)
    .select()
    .single()

  if (uErr) fail('Docente publica clase', uErr.message)
  else pass('Docente publica clase', updated.title)

  const { data: draftAgain, error: dErr } = await teacher.client
    .from('lessons')
    .update({ is_published: false })
    .eq('id', lesson.id)
    .select()
    .single()

  if (dErr) {
    fail('Docente vuelve a borrador', dErr.message)
  } else {
    pass('Docente oculta clase', draftAgain.id)
  }

  if (student) {
    const { data: hidden, error: hErr } = await student.client
      .from('lessons')
      .select('id')
      .eq('id', lesson.id)
      .maybeSingle()

    if (hErr) fail('Alumno select borrador', hErr.message)
    else if (hidden) fail('Alumno NO debe ver borrador', 'vio la clase oculta')
    else pass('Alumno no ve clase borrador')

    await teacher.client.from('lessons').update({ is_published: true }).eq('id', lesson.id)

    const { data: visible, error: vErr } = await student.client
      .from('lessons')
      .select('id, video_url')
      .eq('id', lesson.id)
      .maybeSingle()

    if (vErr) fail('Alumno select publicada', vErr.message)
    else if (!visible) fail('Alumno debería ver clase publicada')
    else pass('Alumno ve clase publicada', visible.video_url ? 'con video' : 'sin video_url')
  }

  // Cleanup lesson
  await teacher.client.from('lessons').delete().eq('id', lesson.id)
  pass('Cleanup clase de prueba')
}

async function testAttendanceUpdate() {
  const docente = {
    email: process.env.TEST_CAMPUS_DOCENTE_EMAIL || 'campus.docente@test.emerge.local',
    password: process.env.TEST_CAMPUS_DOCENTE_PASSWORD || 'CampusEmerge2026!',
  }
  const alumno = {
    email: process.env.TEST_CAMPUS_EMAIL || 'campus.alumno@test.emerge.local',
    password: process.env.TEST_CAMPUS_PASSWORD || 'CampusEmerge2026!',
  }

  let teacher
  try {
    teacher = await login(docente.email, docente.password)
  } catch (e) {
    fail('Login docente (asistencia)', e.message)
    return
  }

  const { data: teaching } = await teacher.client.from('my_teaching_courses').select('course_id').limit(1)
  if (!teaching?.length) {
    fail('Asistencia: sin curso')
    return
  }
  const courseId = teaching[0].course_id

  let student
  try {
    student = await login(alumno.email, alumno.password)
  } catch (e) {
    fail('Login alumno (asistencia)', e.message)
    return
  }

  const admin = await login(
    process.env.TEST_CAMPUS_STAFF_EMAIL || 'campus.admin@test.emerge.local',
    process.env.TEST_CAMPUS_STAFF_PASSWORD || 'CampusEmerge2026!',
  )
  const { error: enrErr } = await admin.client.from('enrollments').upsert(
    { course_id: courseId, student_id: student.user.id, status: 'active' },
    { onConflict: 'course_id,student_id' },
  )
  if (enrErr) {
    fail('Asistencia: inscribir alumno', enrErr.message)
    return
  }

  const studentId = student.user.id
  const today = new Date().toISOString().slice(0, 10)

  let sessionId
  const { data: existing } = await teacher.client
    .from('course_sessions')
    .select('id')
    .eq('course_id', courseId)
    .eq('session_date', today)
    .maybeSingle()
  if (existing?.id) {
    sessionId = existing.id
  } else {
    const { data: created, error: cErr } = await teacher.client
      .from('course_sessions')
      .insert({ course_id: courseId, title: `UX asistencia ${today}`, session_date: today })
      .select()
      .single()
    if (cErr) {
      fail('Crear sesión', cErr.message)
      return
    }
    sessionId = created.id
  }
  pass('Sesión de asistencia', sessionId)

  const payload = {
    session_id: sessionId,
    student_id: studentId,
    status: 'present',
    notes: '',
    marked_by: teacher.user.id,
    marked_at: new Date().toISOString(),
  }

  const { error: iErr } = await teacher.client
    .from('attendance_records')
    .upsert(payload, { onConflict: 'session_id,student_id' })

  if (iErr) {
    fail('Docente upsert asistencia', iErr.message)
    return
  }
  pass('Docente guarda asistencia')

  const { error: uErr } = await teacher.client
    .from('attendance_records')
    .update({ status: 'late', notes: 'llegó tarde (test UX)' })
    .eq('session_id', sessionId)
    .eq('student_id', studentId)

  if (uErr) fail('Docente corrige asistencia', uErr.message)
  else pass('Docente corrige asistencia')
}

async function main() {
  console.log('\n=== test:ux campus ===\n')
  await testVideoHelpers()
  await testTeacherContentPermissions()
  await testAttendanceUpdate()

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} OK`)
  if (failed.length) {
    console.error('Fallaron:', failed.map((f) => f.name).join(', '))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
