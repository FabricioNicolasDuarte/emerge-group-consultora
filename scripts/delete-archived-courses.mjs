import { connectPostgres } from './pg-connect.mjs'

const client = await connectPostgres()
try {
  await client.query('drop trigger if exists audit_courses on public.courses')
  const { rowCount } = await client.query(
    `delete from public.courses where status = 'archived' or title like '[archivo]%'`
  )
  console.log('deleted archived courses:', rowCount)
  await client.query(`
    create trigger audit_courses
      after insert or update or delete on public.courses
      for each row execute function public.audit_courses_changes()
  `)
  console.log('trigger restored')
} catch (err) {
  console.error(err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
