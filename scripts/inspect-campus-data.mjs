import { connectPostgres } from './pg-connect.mjs'

const client = await connectPostgres()
const q = async (sql, params) => (await client.query(sql, params)).rows

console.log('courses', await q('select title, slug, status, price_amount from courses order by created_at'))
console.log('announcements', await q('select title, status, audience from announcements order by created_at'))
console.log('applications', await q('select full_name, email, status from enrollment_applications limit 30'))
console.log('counts', await q(`
  select
    (select count(*)::int from enrollments) as enrollments,
    (select count(*)::int from course_sessions) as sessions,
    (select count(*)::int from modules) as modules,
    (select count(*)::int from lessons) as lessons,
    (select count(*)::int from assessments) as assessments,
    (select count(*)::int from mailbox_threads) as threads,
    (select count(*)::int from certificates) as certificates,
    (select count(*)::int from profiles) as profiles
`))
console.log('profiles', await q('select full_name, email from profiles order by email'))

await client.end()
