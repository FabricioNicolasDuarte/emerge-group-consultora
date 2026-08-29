import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Client } = pg

export function loadEnvFile() {
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

export async function connectPostgres() {
  loadEnvFile()

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
    return client
  }

  if (!ref || !password) {
    throw new Error('Falta SUPABASE_DB_PASSWORD o DATABASE_URL en .env')
  }

  const attempts = [
    { port: 5432 },
    { port: 6543 },
  ]

  let lastError
  for (const attempt of attempts) {
    const client = new Client({
      host: poolerHost,
      port: attempt.port,
      user: `postgres.${ref}`,
      password,
      database,
      ssl: { rejectUnauthorized: false },
    })
    try {
      await client.connect()
      return client
    } catch (error) {
      lastError = error
      await client.end().catch(() => {})
    }
  }

  throw lastError ?? new Error('No se pudo conectar a Postgres')
}
