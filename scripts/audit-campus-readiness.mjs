/**
 * Auditoría operativa del Campus (DB + checklist).
 * node scripts/audit-campus-readiness.mjs
 */
import { connectPostgres } from './pg-connect.mjs'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const issues = []
const ok = []
const warn = []

function note(list, msg) {
  list.push(msg)
}

async function main() {
  const migDir = resolve(process.cwd(), 'supabase/migrations')
  const migFiles = existsSync(migDir)
    ? readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()
    : []

  console.log('\n=== AUDITORÍA CAMPUS EMERGE ===\n')
  console.log(`Migraciones en repo: ${migFiles.length}`)
  migFiles.forEach((f) => console.log(`  - ${f}`))

  const client = await connectPostgres()
  try {
    // Schema / tables
    const needTables = [
      'profiles', 'roles', 'user_roles', 'courses', 'modules', 'lessons',
      'enrollments', 'course_assignments', 'course_sessions', 'attendance_records',
      'assessments', 'student_grades', 'announcements', 'notifications',
      'audit_logs', 'certificates', 'course_payments', 'mailbox_threads',
      'mailbox_messages', 'mailbox_participants', 'enrollment_applications',
    ]
    const { rows: tables } = await client.query(`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
    `)
    const have = new Set(tables.map((r) => r.table_name))
    for (const t of needTables) {
      if (have.has(t)) note(ok, `Tabla public.${t}`)
      else note(issues, `FALTA tabla public.${t}`)
    }

    // Columns ficha / meeting
    const colChecks = [
      ['profiles', ['phone', 'city', 'job_role', 'occupation', 'audience', 'challenge']],
      ['course_sessions', ['meeting_url', 'meeting_provider']],
      ['courses', ['price_amount', 'enrollment_cap', 'cohort_start_date']],
      ['announcements', ['body_html']],
      ['enrollment_applications', ['status', 'email', 'course_id', 'challenge', 'job_role']],
    ]
    for (const [table, cols] of colChecks) {
      if (!have.has(table)) continue
      const { rows } = await client.query(
        `select column_name from information_schema.columns
         where table_schema = 'public' and table_name = $1`,
        [table],
      )
      const cset = new Set(rows.map((r) => r.column_name))
      for (const c of cols) {
        if (cset.has(c)) note(ok, `${table}.${c}`)
        else note(issues, `FALTA columna ${table}.${c}`)
      }
    }

    // Views
    const needViews = [
      'admin_enrollment_applications',
      'admin_course_stats',
      'my_enrollments',
      'course_catalog',
    ]
    const { rows: views } = await client.query(`
      select table_name from information_schema.views where table_schema = 'public'
    `)
    const vset = new Set(views.map((r) => r.table_name))
    for (const v of needViews) {
      if (vset.has(v)) note(ok, `Vista ${v}`)
      else note(warn, `Vista ${v} no encontrada (puede llamarse distinto)`)
    }

    // Roles
    const { rows: roles } = await client.query(`select slug from public.roles order by slug`)
    const roleSlugs = roles.map((r) => r.slug)
    for (const slug of ['superadmin', 'admin', 'coordinador', 'docente', 'tutor', 'alumno']) {
      if (roleSlugs.includes(slug)) note(ok, `Rol ${slug}`)
      else note(issues, `FALTA rol ${slug}`)
    }

    // Superadmin exists
    const { rows: supers } = await client.query(`
      select p.email, p.full_name
      from public.profiles p
      join public.user_roles ur on ur.user_id = p.id
      join public.roles r on r.id = ur.role_id
      where r.slug = 'superadmin'
    `)
    if (supers.length) {
      note(ok, `Superadmins: ${supers.map((s) => s.email).join(', ')}`)
      const onlyTest = supers.every((s) => String(s.email).includes('test.emerge.local'))
      if (onlyTest) note(warn, 'Solo hay superadmin de prueba (@test.emerge.local). Para prod creá uno real.')
    } else {
      note(issues, 'No hay ningún usuario con rol superadmin')
    }

    // Storage buckets
    const { rows: buckets } = await client.query(`
      select id, public from storage.buckets order by id
    `).catch(() => ({ rows: [] }))
    if (!buckets.length) {
      note(warn, 'No se pudieron listar storage.buckets (¿permiso?)')
    } else {
      const ids = buckets.map((b) => b.id)
      for (const b of ['public-assets', 'course-materials', 'course-recordings', 'announcement-media']) {
        if (ids.includes(b)) note(ok, `Bucket ${b}`)
        else note(warn, `Bucket ${b} no listado`)
      }
    }

    // RLS enabled on key tables
    const { rows: rls } = await client.query(`
      select c.relname as table_name, c.relrowsecurity as rls
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and c.relname = any($1::text[])
    `, [needTables])
    for (const row of rls) {
      if (row.rls) note(ok, `RLS on ${row.table_name}`)
      else note(issues, `RLS OFF en ${row.table_name}`)
    }

    // Counts snapshot
    const { rows: counts } = await client.query(`
      select
        (select count(*)::int from courses) as courses,
        (select count(*)::int from courses where status = 'published') as published,
        (select count(*)::int from profiles) as profiles,
        (select count(*)::int from enrollments) as enrollments,
        (select count(*)::int from enrollment_applications) as applications,
        (select count(*)::int from announcements where status = 'published') as announcements
    `)
    console.log('\nConteos actuales:', counts[0])

    // Functions used by app
    const needFns = [
      'has_any_role',
      'can_manage_academics',
      'dev_assign_campus_role',
    ]
    for (const fn of needFns) {
      const { rows } = await client.query(
        `select 1 from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = $1 limit 1`,
        [fn],
      )
      if (rows.length) note(ok, `Función ${fn}()`)
      else note(warn, `Función ${fn}() no encontrada`)
    }
  } finally {
    await client.end()
  }

  // Env local
  const envPath = resolve(process.cwd(), '.env')
  if (existsSync(envPath)) {
    const env = readFileSync(envPath, 'utf8')
    const keys = [
      'NUXT_PUBLIC_SUPABASE_URL',
      'NUXT_PUBLIC_SUPABASE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_DB_PASSWORD',
    ]
    for (const k of keys) {
      if (env.includes(`${k}=`) && !env.match(new RegExp(`${k}=\\s*$`, 'm'))) {
        note(ok, `.env local tiene ${k}`)
      } else {
        note(issues, `.env local sin ${k}`)
      }
    }
    if (!env.includes('NUXT_PUBLIC_APP_URL=')) {
      note(warn, '.env local sin NUXT_PUBLIC_APP_URL (en Vercel debe apuntar al dominio real)')
    }
    if (!env.includes('MERCADOPAGO_ACCESS_TOKEN=')) {
      note(ok, 'Mercado Pago no configurado (opcional; inscripción gratis/manual OK)')
    }
  } else {
    note(issues, 'No hay archivo .env local')
  }

  // Critical server files
  const files = [
    'server/api/campus/admin/users.post.ts',
    'server/api/campus/admin/applications/import.post.ts',
    'server/api/campus/admin/applications/convert.post.ts',
    'supabase/migrations/20260327900000_enrollment_applications.sql',
    'docs/DEPLOY.md',
    'docs/SETUP-SUPABASE.md',
  ]
  for (const f of files) {
    if (existsSync(resolve(process.cwd(), f))) note(ok, `Archivo ${f}`)
    else note(issues, `Falta archivo ${f}`)
  }

  console.log(`\n--- OK (${ok.length}) ---`)
  ok.forEach((m) => console.log(`  ✓ ${m}`))
  console.log(`\n--- WARN (${warn.length}) ---`)
  warn.forEach((m) => console.log(`  ! ${m}`))
  console.log(`\n--- BLOCKERS (${issues.length}) ---`)
  issues.forEach((m) => console.log(`  ✗ ${m}`))

  console.log('\n=== FIN ===\n')
  if (issues.length) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
