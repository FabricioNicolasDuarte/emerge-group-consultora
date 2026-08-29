/**
 * Configura datos demo del campus: cohortes, docente, inscripciones, anuncio y clase en vivo.
 * Requiere: npm run seed:test-users (usuarios de prueba)
 * Ejecutar: npm run seed:demo
 */

import { connectPostgres } from './pg-connect.mjs'

const DEMO_COHORTS = [
  {
    slug: 'liderazgo-sanmartiniano',
    enrollment_cap: 30,
    cohort_months_ahead: { start: 0, end: 4 },
  },
  {
    slug: 'evolucion-profesional-ia',
    enrollment_cap: 15,
    cohort_months_ahead: { start: 1, end: 5 },
    status: 'published',
    price_amount: 0,
  },
  {
    slug: 'comunicacion-oratoria',
    enrollment_cap: 5,
    cohort_months_ahead: { start: 0, end: 3 },
    status: 'published',
    price_amount: 0,
  },
]

const COURSE_SLUGS = DEMO_COHORTS.map((c) => c.slug)

const TEST_EMAILS = {
  docente: 'campus.docente@test.emerge.local',
  alumno: 'campus.alumno@test.emerge.local',
  admin: 'campus.admin@test.emerge.local',
}

function addMonths(date, months) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function toDateString(date) {
  return date.toISOString().slice(0, 10)
}

function cohortPayload({ cohort_months_ahead }) {
  const now = new Date()
  const start = addMonths(now, cohort_months_ahead.start)
  const end = addMonths(now, cohort_months_ahead.end)
  const enrollmentStarts = new Date(now)
  enrollmentStarts.setDate(enrollmentStarts.getDate() - 7)
  const enrollmentEnds = addMonths(now, cohort_months_ahead.end)
  enrollmentEnds.setDate(enrollmentEnds.getDate() - 14)

  return {
    cohort_start_date: toDateString(start),
    cohort_end_date: toDateString(end),
    enrollment_starts_at: enrollmentStarts.toISOString(),
    enrollment_ends_at: enrollmentEnds.toISOString(),
  }
}

async function findProfileId(client, email) {
  const { rows } = await client.query(
    'select id from public.profiles where email = $1 limit 1',
    [email],
  )
  return rows[0]?.id ?? null
}

async function assignTeacher(client, courseId, teacherId, title) {
  await client.query(
    `insert into public.course_assignments (course_id, teacher_id, role)
     values ($1, $2, 'docente')
     on conflict (course_id, teacher_id) do nothing`,
    [courseId, teacherId],
  )
  console.log(`✓ docente asignado a ${title}`)
}

async function enrollStudent(client, courseId, studentId, title) {
  await client.query(
    `insert into public.enrollments (course_id, student_id, status, progress_percent)
     values ($1, $2, 'active', 0)
     on conflict (course_id, student_id) do update
       set status = excluded.status`,
    [courseId, studentId],
  )
  console.log(`✓ alumno inscripto en ${title}`)
}

async function seedDemoAnnouncement(client, adminId) {
  const title = 'Bienvenida al Campus — demo'
  const { rows: existing } = await client.query(
    `select id from public.announcements where title = $1 limit 1`,
    [title],
  )
  if (existing.length) {
    console.log('· anuncio demo ya existe')
    return
  }

  await client.query(
    `insert into public.announcements (
       title, body, body_html, audience, status, is_pinned, published_at, created_by
     ) values ($1, $2, $3, 'all', 'published', true, now(), $4)`,
    [
      title,
      'Este es un anuncio de demostración del Campus Emerge.',
      '<p>Este es un <strong>anuncio de demostración</strong> del Campus Emerge. Podés editarlo desde el panel de comunicaciones.</p>',
      adminId,
    ],
  )
  console.log('✓ anuncio público de demo publicado')
}

async function seedLiveSession(client, courseId, title) {
  const sessionTitle = 'Encuentro en vivo — demo'
  const { rows: existing } = await client.query(
    `select id from public.course_sessions
     where course_id = $1 and title = $2 limit 1`,
    [courseId, sessionTitle],
  )
  if (existing.length) {
    await client.query(
      `update public.course_sessions
       set meeting_url = $1, meeting_provider = 'jitsi'
       where id = $2`,
      ['https://meet.jit.si/emerge-campus-demo', existing[0].id],
    )
    console.log(`✓ sesión en vivo actualizada en ${title}`)
    return
  }

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  await client.query(
    `insert into public.course_sessions (
       course_id, title, session_date, start_time, meeting_url, meeting_provider
     ) values ($1, $2, $3, '18:00', $4, 'jitsi')`,
    [courseId, sessionTitle, toDateString(nextWeek), 'https://meet.jit.si/emerge-campus-demo'],
  )
  console.log(`✓ sesión en vivo demo en ${title}`)
}

async function main() {
  const client = await connectPostgres()

  console.log('\nConfigurando datos demo del campus...\n')

  try {
    for (const item of DEMO_COHORTS) {
      const cohort = cohortPayload(item)
      const { rowCount } = await client.query(
        `update public.courses
         set
           cohort_start_date = $1,
           cohort_end_date = $2,
           enrollment_starts_at = $3,
           enrollment_ends_at = $4,
           enrollment_cap = $5,
           status = coalesce($6::public.course_status, status),
           price_amount = coalesce($7, price_amount)
         where slug = $8`,
        [
          cohort.cohort_start_date,
          cohort.cohort_end_date,
          cohort.enrollment_starts_at,
          cohort.enrollment_ends_at,
          item.enrollment_cap,
          item.status ?? null,
          item.price_amount ?? null,
          item.slug,
        ],
      )

      if (!rowCount) {
        console.log(`· omitido (no existe): ${item.slug}`)
        continue
      }
      console.log(`✓ cohorte ${item.slug} (cupo ${item.enrollment_cap})`)
    }

    const teacherId = await findProfileId(client, TEST_EMAILS.docente)
    const studentId = await findProfileId(client, TEST_EMAILS.alumno)
    const adminId = await findProfileId(client, TEST_EMAILS.admin)

    if (!teacherId || !studentId) {
      console.log('\nUsuarios de prueba no encontrados. Corré primero: npm run seed:test-users\n')
      process.exit(1)
    }

    const { rows: courses } = await client.query(
      `select id, title, slug from public.courses where slug = any($1::text[])`,
      [COURSE_SLUGS],
    )

    for (const course of courses) {
      await assignTeacher(client, course.id, teacherId, course.title)
      await enrollStudent(client, course.id, studentId, course.title)
    }

    const mainCourse = courses.find((c) => c.slug === 'liderazgo-sanmartiniano')
    if (mainCourse) {
      await seedLiveSession(client, mainCourse.id, mainCourse.title)
    }

    if (adminId) {
      await seedDemoAnnouncement(client, adminId)
    }

    console.log('\nListo. Probar en:')
    console.log('  Catálogo:  http://localhost:3000/campus#programas')
    console.log('  Curso:     http://localhost:3000/campus/cursos/liderazgo-sanmartiniano')
    console.log('  Anuncios:  http://localhost:3000/campus#avisos')
    console.log('  Admin:     http://localhost:3000/campus/admin/cursos\n')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\nError:', err.message || err)
  process.exit(1)
})
