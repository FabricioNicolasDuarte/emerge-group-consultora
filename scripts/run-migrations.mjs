/**
 * Ejecuta migraciones SQL pendientes contra Postgres de Supabase.
 * Requiere en .env: SUPABASE_DB_PASSWORD (o DATABASE_URL completa)
 *
 * Uso: npm run db:migrate
 */

import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import pg from 'pg'

const { Client } = pg

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

function getProjectRef(url) {
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match?.[1] ?? null
}

async function connectClient() {
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD
  const ref = getProjectRef(url)
  const poolerHost = process.env.SUPABASE_POOLER_HOST || 'aws-0-ca-central-1.pooler.supabase.com'
  const database = process.env.SUPABASE_DB_NAME || 'postgres'

  if (process.env.DATABASE_URL) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
    await client.connect()
    console.log('Conectado a Postgres (DATABASE_URL).')
    return client
  }

  if (!ref || !password) {
    console.error('\nFalta conexión a Postgres.')
    console.error('Agregá SUPABASE_DB_PASSWORD o DATABASE_URL en .env\n')
    process.exit(1)
  }

  const attempts = [
    { label: `pooler session (${poolerHost})`, port: 5432 },
    { label: `pooler transaction (${poolerHost})`, port: 6543 },
  ]

  const errors = []
  for (const attempt of attempts) {
    const client = new Client({
      host: process.env.SUPABASE_DB_HOST || poolerHost,
      port: Number(process.env.SUPABASE_DB_PORT || attempt.port),
      user: process.env.SUPABASE_DB_USER || `postgres.${ref}`,
      password,
      database,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    })

    try {
      await client.connect()
      console.log(`Conectado a Postgres (${attempt.label}).`)
      return client
    } catch (error) {
      errors.push(`${attempt.label}: ${error.message}`)
      try {
        await client.end()
      } catch {
        /* noop */
      }
    }
  }

  const authFailed = errors.some((line) => /password authentication failed/i.test(line))
  if (authFailed) {
    throw new Error(
      'Contraseña de base incorrecta. En Supabase → Project Settings → Database copiá la "Database password" (no es la anon key ni la service role key). Si tiene caracteres especiales, probá pegar la connection string completa en DATABASE_URL.',
    )
  }

  throw new Error(errors.join('\n'))
}

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists public._schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `)
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query('select filename from public._schema_migrations order by filename')
  return new Set(rows.map((row) => row.filename))
}

async function bootstrapAppliedMigrations(client, files) {
  const { rows } = await client.query('select count(*)::int as n from public._schema_migrations')
  if (rows[0]?.n > 0) return

  const { rows: mailbox } = await client.query("select to_regclass('public.mailbox_threads') as reg")
  if (!mailbox[0]?.reg) return

  const cutoff = '20260327300000_fix_announcement_views_invoker.sql'
  const prior = files.filter((name) => name < cutoff)
  for (const filename of prior) {
    await client.query(
      'insert into public._schema_migrations (filename) values ($1) on conflict do nothing',
      [filename],
    )
  }
  if (prior.length) {
    console.log(`· bootstrap: ${prior.length} migraciones previas marcadas como aplicadas`)
  }
}

async function run() {
  loadEnv()

  const migrationsDir = resolve(process.cwd(), 'supabase/migrations')
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  const only = process.argv.slice(2).filter((arg) => !arg.startsWith('-'))
  const pendingOnly = only.length > 0 ? files.filter((name) => only.some((part) => name.includes(part))) : files

  const client = await connectClient()

  try {
    await ensureMigrationsTable(client)
    await bootstrapAppliedMigrations(client, files)
    const applied = await getAppliedMigrations(client)

    let ran = 0
    for (const filename of pendingOnly) {
      if (applied.has(filename)) {
        console.log(`· omitida (ya aplicada): ${filename}`)
        continue
      }

      const sql = readFileSync(join(migrationsDir, filename), 'utf8')
      console.log(`→ aplicando: ${filename}`)
      await client.query('begin')
      try {
        await client.query(sql)
        await client.query('insert into public._schema_migrations (filename) values ($1)', [filename])
        await client.query('commit')
        ran++
        console.log(`✓ ${filename}`)
      } catch (error) {
        await client.query('rollback')
        throw error
      }
    }

    if (!ran) {
      console.log('\nNo había migraciones nuevas.')
    } else {
      console.log(`\n${ran} migración(es) aplicada(s).`)
    }
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error('\nError al migrar:', error.message)
  process.exit(1)
})
