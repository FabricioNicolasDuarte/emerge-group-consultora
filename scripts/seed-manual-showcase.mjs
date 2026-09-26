/**
 * Limpia contenido de prueba feo y carga un showcase prolijo para el manual.
 * Conserva: usuarios (roles), esquema de Solicitudes.
 * Ejecutar: node scripts/seed-manual-showcase.mjs
 */
import { connectPostgres } from './pg-connect.mjs'

const EMAILS = {
  admin: 'campus.admin@test.emerge.local',
  teacher: 'campus.docente@test.emerge.local',
  student: 'campus.alumno@test.emerge.local',
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

async function findId(client, email) {
  const { rows } = await client.query('select id from public.profiles where email = $1 limit 1', [email])
  return rows[0]?.id ?? null
}

async function wipeContent(client) {
  console.log('\n1) Limpiando contenido cargado (conserva usuarios y roles)…')

  await client.query('delete from public.mailbox_attachments')
  await client.query('delete from public.mailbox_messages')
  await client.query('delete from public.mailbox_participants')
  await client.query('delete from public.mailbox_threads')
  await client.query('delete from public.announcement_media')
  await client.query('delete from public.announcements')
  await client.query('delete from public.notifications')
  await client.query('delete from public.enrollment_applications')
  await client.query('delete from public.certificates')
  await client.query('delete from public.course_payments')
  await client.query('delete from public.student_grades')
  await client.query('delete from public.assessments')
  await client.query('delete from public.attendance_records')
  await client.query('delete from public.course_sessions')
  await client.query('delete from public.lesson_completions')
  await client.query('delete from public.lesson_materials')
  await client.query('delete from public.lessons')
  await client.query('delete from public.modules')
  await client.query('delete from public.enrollments')
  await client.query('delete from public.course_assignments')
  await client.query('update public.audit_logs set course_id = null')
  await client.query('delete from public.audit_logs')

  // Borrar cursos: el trigger de auditoría intenta insertar course_id ya borrado
  await client.query('drop trigger if exists audit_courses on public.courses')
  await client.query('delete from public.courses')
  await client.query(`
    create trigger audit_courses
      after insert or update or delete on public.courses
      for each row execute function public.audit_courses_changes()
  `)

  console.log('   ✓ tablas de contenido vacías')
}

async function polishProfiles(client, ids) {
  console.log('\n2) Perfiles con nombres presentables…')
  await client.query(
    `update public.profiles set
       full_name = 'Marina López',
       phone = '5493704123456',
       city = 'Resistencia, Chaco',
       job_role = 'Coordinadora académica',
       occupation = 'Educación',
       audience = 'Equipo Emerge',
       challenge = null
     where id = $1`,
    [ids.admin],
  )
  await client.query(
    `update public.profiles set
       full_name = 'Diego Fernández',
       phone = '5493704987654',
       city = 'Corrientes',
       job_role = 'Docente',
       occupation = 'Formación profesional',
       audience = 'Programas abiertos',
       challenge = null
     where id = $1`,
    [ids.teacher],
  )
  await client.query(
    `update public.profiles set
       full_name = 'Lucía Benítez',
       phone = '5493704556677',
       city = 'Formosa',
       job_role = 'Analista de procesos',
       occupation = 'Administración pública',
       audience = 'Profesionales en ejercicio',
       challenge = 'Mejorar la comunicación con equipos interdisciplinarios'
     where id = $1`,
    [ids.student],
  )
  console.log('   ✓ Marina (admin), Diego (docente), Lucía (alumno)')
}

async function seedCourses(client, ids) {
  console.log('\n3) Cursos, módulos y lecciones…')
  const now = new Date()

  const courses = [
    {
      title: 'Liderazgo Sanmartiniano',
      slug: 'liderazgo-sanmartiniano',
      description:
        'Desarrollá liderazgos actuales desde la dimensión humana, ética y estratégica de José de San Martín. Pensado para equipos que necesitan claridad, propósito y decisiones sostenibles.',
      category: 'Liderazgo',
      price: 0,
      cap: 30,
      modules: [
        {
          title: 'Propósito y legado',
          description: 'Fundamentos del liderazgo con sentido.',
          lessons: [
            ['Bienvenida al programa', 'Presentación, mapa del recorrido y expectativas.', 12],
            ['¿Qué significa liderar hoy?', 'Del mando a la responsabilidad compartida.', 18],
          ],
        },
        {
          title: 'Estrategia y decisiones',
          description: 'Visión estratégica en contextos desafiantes.',
          lessons: [
            ['Prioridades que ordenan', 'Cómo elegir qué sí y qué no.', 16],
            ['Decisiones bajo presión', 'Marcos simples para equipos reales.', 20],
          ],
        },
        {
          title: 'Comunicación y equipos',
          description: 'Confianza, conversaciones y clima de trabajo.',
          lessons: [
            ['Conversaciones que construyen', 'Escucha, feedback y acuerdos.', 22],
          ],
        },
      ],
    },
    {
      title: 'Evolución Profesional en Tiempos de IA',
      slug: 'evolucion-profesional-ia',
      description:
        'Integrá inteligencia artificial, nuevas competencias y desarrollo humano en tu práctica profesional, sin perder el criterio y la ética del trabajo.',
      category: 'Innovación',
      price: 0,
      cap: 25,
      modules: [
        {
          title: 'Mapa de competencias',
          description: 'Qué cambia y qué permanece.',
          lessons: [
            ['IA en el trabajo cotidiano', 'Casos reales y límites sanos.', 15],
            ['Tu plan de evolución', 'Prioridades de aprendizaje de 90 días.', 14],
          ],
        },
      ],
    },
    {
      title: 'Comunicación y Oratoria',
      slug: 'comunicacion-oratoria',
      description:
        'Herramientas para comunicar con claridad, presencia e impacto en reuniones, aulas y presentaciones.',
      category: 'Comunicación',
      price: 0,
      cap: 20,
      modules: [
        {
          title: 'Presencia y mensaje',
          description: 'Estructura, voz y audiencia.',
          lessons: [
            ['El mensaje en tres actos', 'Apertura, desarrollo y cierre.', 17],
            ['Presencia en escena', 'Cuerpo, voz y conexión.', 19],
          ],
        },
      ],
    },
    {
      title: 'Diplomatura en Gestión y Liderazgo',
      slug: 'diplomatura-gestion-liderazgo',
      description:
        'Programa integral para potenciar la gestión de equipos, la toma de decisiones y el liderazgo en organizaciones públicas y privadas del NEA.',
      category: 'Diplomatura',
      price: 0,
      cap: 40,
      modules: [
        {
          title: 'Módulo inaugural',
          description: 'Marco del programa y comunidad de aprendizaje.',
          lessons: [
            ['Apertura de la Diplomatura', 'Presentación del equipo y del recorrido.', 20],
            ['Diagnóstico de rol', 'Mapa personal de desafíos laborales.', 25],
          ],
        },
      ],
    },
  ]

  const created = {}

  for (const course of courses) {
    const start = addDays(now, -7)
    const end = addDays(now, 120)
    const enrollStart = addDays(now, -14)
    const enrollEnd = addDays(now, 90)

    const { rows } = await client.query(
      `insert into public.courses (
         title, slug, description, category, status, price_amount,
         enrollment_cap, cohort_start_date, cohort_end_date,
         enrollment_starts_at, enrollment_ends_at, created_by
       ) values ($1,$2,$3,$4,'published',$5,$6,$7,$8,$9,$10,$11)
       returning id`,
      [
        course.title,
        course.slug,
        course.description,
        course.category,
        course.price,
        course.cap,
        isoDate(start),
        isoDate(end),
        enrollStart.toISOString(),
        enrollEnd.toISOString(),
        ids.admin,
      ],
    )
    const courseId = rows[0].id
    created[course.slug] = courseId

    await client.query(
      `insert into public.course_assignments (course_id, teacher_id, role)
       values ($1, $2, 'docente')`,
      [courseId, ids.teacher],
    )

    let moduleOrder = 1
    for (const mod of course.modules) {
      const { rows: modRows } = await client.query(
        `insert into public.modules (course_id, title, description, sort_order)
         values ($1,$2,$3,$4) returning id`,
        [courseId, mod.title, mod.description, moduleOrder++],
      )
      const moduleId = modRows[0].id
      let lessonOrder = 1
      for (const [title, description, mins] of mod.lessons) {
        await client.query(
          `insert into public.lessons (
             module_id, title, description, content_type, duration_minutes,
             sort_order, is_published
           ) values ($1,$2,$3,'video',$4,$5,true)`,
          [moduleId, title, description, mins, lessonOrder++],
        )
      }
    }

    console.log(`   ✓ ${course.title}`)
  }

  return created
}

async function seedEnrollmentsAndProgress(client, ids, courses) {
  console.log('\n4) Inscripciones, progreso, asistencia y notas…')
  const leadership = courses['liderazgo-sanmartiniano']
  const oratoria = courses['comunicacion-oratoria']
  const ia = courses['evolucion-profesional-ia']

  const { rows: enr1 } = await client.query(
    `insert into public.enrollments (course_id, student_id, status, progress_percent)
     values ($1,$2,'active',62) returning id`,
    [leadership, ids.student],
  )
  await client.query(
    `insert into public.enrollments (course_id, student_id, status, progress_percent)
     values ($1,$2,'active',28)`,
    [oratoria, ids.student],
  )
  await client.query(
    `insert into public.enrollments (course_id, student_id, status, progress_percent)
     values ($1,$2,'active',10)`,
    [ia, ids.student],
  )

  // Completions on first lessons of liderazgo
  const { rows: lessons } = await client.query(
    `select l.id
     from public.lessons l
     join public.modules m on m.id = l.module_id
     where m.course_id = $1
     order by m.sort_order, l.sort_order
     limit 3`,
    [leadership],
  )
  for (const lesson of lessons) {
    await client.query(
      `insert into public.lesson_completions (lesson_id, student_id, completed_at)
       values ($1,$2,now() - interval '2 days')
       on conflict (lesson_id, student_id) do nothing`,
      [lesson.id, ids.student],
    )
  }

  // Sessions + attendance
  const sessions = [
    ['Encuentro 1 — Propósito y equipo', -14, 'present'],
    ['Encuentro 2 — Decisiones con criterio', -7, 'present'],
    ['Encuentro 3 — Comunicación de acuerdos', 7, null],
  ]
  for (const [title, dayOffset, status] of sessions) {
    const date = isoDate(addDays(new Date(), dayOffset))
    const { rows } = await client.query(
      `insert into public.course_sessions (
         course_id, title, session_date, start_time, end_time,
         meeting_url, meeting_provider, notes, created_by
       ) values ($1,$2,$3,'18:00','20:00',$4,'jitsi',$5,$6)
       returning id`,
      [
        leadership,
        title,
        date,
        'https://meet.jit.si/emerge-liderazgo-cohort',
        'Sesión sincrónica del programa.',
        ids.teacher,
      ],
    )
    if (status) {
      await client.query(
        `insert into public.attendance_records (session_id, student_id, status, marked_by)
         values ($1,$2,$3,$4)`,
        [rows[0].id, ids.student, status, ids.teacher],
      )
    }
  }

  // Assessments + grades
  const { rows: a1 } = await client.query(
    `insert into public.assessments (
       course_id, title, description, max_score, weight_percent, due_date, is_published, created_by
     ) values ($1,$2,$3,100,40,$4,true,$5) returning id`,
    [
      leadership,
      'Reflexión — Propósito y rol',
      'Entrega escrita breve sobre tu propósito de liderazgo en el contexto actual.',
      isoDate(addDays(new Date(), -3)),
      ids.teacher,
    ],
  )
  const { rows: a2 } = await client.query(
    `insert into public.assessments (
       course_id, title, description, max_score, weight_percent, due_date, is_published, created_by
     ) values ($1,$2,$3,100,60,$4,true,$5) returning id`,
    [
      leadership,
      'Caso práctico — Decisión de equipo',
      'Análisis de un caso y propuesta de acción en 1 página.',
      isoDate(addDays(new Date(), 14)),
      ids.teacher,
    ],
  )
  await client.query(
    `insert into public.student_grades (assessment_id, student_id, score, feedback, graded_by)
     values ($1,$2,88,'Muy buena claridad en el propósito. Profundizá el vínculo con el equipo.',$3)`,
    [a1[0].id, ids.student, ids.teacher],
  )
  await client.query(
    `insert into public.student_grades (assessment_id, student_id, score, feedback, graded_by)
     values ($1,$2,null,'',$3)`,
    [a2[0].id, ids.student, ids.teacher],
  )

  console.log('   ✓ Lucía inscripta en 3 cursos · asistencia · notas')
  return enr1[0].id
}

async function seedAnnouncements(client, ids, courses) {
  console.log('\n5) Anuncios y avisos…')
  const items = [
    {
      title: 'Bienvenida al Campus Emerge',
      body: 'Te damos la bienvenida. Acá vas a encontrar tus programas, materiales, encuentros en vivo y certificados.',
      html: '<p>Te damos la bienvenida al <strong>Campus Emerge</strong>.</p><p>Desde tu panel podés seguir el progreso, revisar asistencia y participar de los encuentros en vivo.</p>',
      audience: 'all',
      pinned: true,
      courseId: null,
    },
    {
      title: 'Calendario de encuentros — Liderazgo Sanmartiniano',
      body: 'Los encuentros sincrónicos son los martes de 18 a 20 hs. El link de la sala está en Asistencia del curso.',
      html: '<p>Los encuentros sincrónicos son los <strong>martes de 18 a 20 hs</strong>.</p><p>El link de la sala está disponible en la sección <em>Asistencia</em> del curso.</p>',
      audience: 'course',
      pinned: false,
      courseId: courses['liderazgo-sanmartiniano'],
    },
    {
      title: 'Recordatorio para docentes',
      body: 'Antes de cada encuentro, revisá la planilla de asistencia y publicá la evaluación correspondiente.',
      html: '<p>Antes de cada encuentro, revisá la planilla de <strong>asistencia</strong> y publicá la evaluación correspondiente.</p>',
      audience: 'teachers',
      pinned: false,
      courseId: null,
    },
    {
      title: 'Apertura de la Diplomatura',
      body: 'Ya está abierta la inscripción a la Diplomatura en Gestión y Liderazgo. Coordinación cargará las fichas desde Solicitudes.',
      html: '<p>Ya está abierta la inscripción a la <strong>Diplomatura en Gestión y Liderazgo</strong>.</p><p>El equipo de coordinación cargará las fichas desde <em>Solicitudes</em>.</p>',
      audience: 'all',
      pinned: true,
      courseId: null,
    },
  ]

  for (const item of items) {
    await client.query(
      `insert into public.announcements (
         title, body, body_html, audience, course_id, status, is_pinned, published_at, created_by
       ) values ($1,$2,$3,$4::public.announcement_audience,$5,'published',$6,now(),$7)`,
      [item.title, item.body, item.html, item.audience, item.courseId, item.pinned, ids.admin],
    )
  }
  console.log(`   ✓ ${items.length} anuncios publicados`)
}

async function seedApplications(client, ids, courses) {
  console.log('\n6) Solicitudes de inscripción (ficha Diplomatura)…')
  const courseId = courses['diplomatura-gestion-liderazgo']
  const rows = [
    ['Ana Gómez', 'ana.gomez@ejemplo.com', '5493704111001', 'PyME', 'Ordenar la gestión del equipo comercial', 'Gerenta comercial', 'Comercio', 'Resistencia', 'ready'],
    ['Martín Acosta', 'martin.acosta@ejemplo.com', '5493704111002', 'Sector público', 'Mejorar la coordinación interáreas', 'Director de área', 'Administración', 'Corrientes', 'ready'],
    ['Valentina Ruiz', 'valentina.ruiz@ejemplo.com', '5493704111003', 'Educación', 'Fortalecer liderazgo pedagógico', 'Directora', 'Educación', 'Formosa', 'ready'],
    ['Pablo Méndez', 'pablo.mendez@ejemplo.com', null, 'Emprendedor', null, 'Fundador', 'Servicios', 'Roque Sáenz Peña', 'pending'],
    ['Carla Íñez', 'carla.nunez@ejemplo.com', '5493704111005', 'ONG', 'Comunicar mejor el impacto del proyecto', null, 'Social', 'Posadas', 'pending'],
  ]

  for (const [full_name, email, phone, audience, challenge, job_role, occupation, city, status] of rows) {
    await client.query(
      `insert into public.enrollment_applications (
         course_id, full_name, email, phone, audience, challenge, job_role, occupation, city,
         status, source, created_by
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::public.application_status,'manual',$11)`,
      [courseId, full_name, email, phone, audience, challenge, job_role, occupation, city, status, ids.admin],
    )
  }
  console.log(`   ✓ ${rows.length} solicitudes (3 listas · 2 en duda)`)
}

async function seedMailbox(client, ids) {
  console.log('\n7) Buzón de ejemplo…')
  const { rows: thread } = await client.query(
    `insert into public.mailbox_threads (subject, created_by)
     values ('Consulta sobre el encuentro del martes', $1)
     returning id`,
    [ids.student],
  )
  const threadId = thread[0].id
  await client.query(
    `insert into public.mailbox_participants (thread_id, user_id, participant_role)
     values ($1,$2,'owner'), ($1,$3,'member')`,
    [threadId, ids.student, ids.teacher],
  )
  await client.query(
    `insert into public.mailbox_messages (thread_id, sender_id, body_html, body_text, message_type)
     values
       ($1,$2,'<p>Hola Diego, ¿el encuentro del martes mantiene el horario de 18 hs?</p>','Hola Diego, ¿el encuentro del martes mantiene el horario de 18 hs?','message'),
       ($1,$3,'<p>Hola Lucía, sí: <strong>18 a 20 hs</strong>. El link está en Asistencia del curso.</p>','Hola Lucía, sí: 18 a 20 hs. El link está en Asistencia del curso.','reply')`,
    [threadId, ids.student, ids.teacher],
  )
  console.log('   ✓ hilo Lucía ↔ Diego')
}

async function main() {
  const client = await connectPostgres()
  console.log('\n=== Showcase Campus para manual ===')

  try {
    const ids = {
      admin: await findId(client, EMAILS.admin),
      teacher: await findId(client, EMAILS.teacher),
      student: await findId(client, EMAILS.student),
    }
    if (!ids.admin || !ids.teacher || !ids.student) {
      console.error('Faltan usuarios seed. Corré: npm run seed:test-users')
      process.exit(1)
    }

    await wipeContent(client)
    await polishProfiles(client, ids)
    const courses = await seedCourses(client, ids)
    await seedEnrollmentsAndProgress(client, ids, courses)
    await seedAnnouncements(client, ids, courses)
    await seedApplications(client, ids, courses)
    await seedMailbox(client, ids)

    console.log('\nListo. Contenido prolijo cargado.')
    console.log('Siguiente: node scripts/capture-manual-screenshots.mjs\n')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\nError:', err.message || err)
  process.exit(1)
})
