import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

export function loadEnv() {
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

export function createAdminClient() {
  loadEnv()
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY

  if (!url || !serviceKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY o URL en .env')
  }

  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64url').toString('utf8'))
    if (payload.role !== 'service_role') {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY no es service_role')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('service_role')) throw error
    throw new Error('SUPABASE_SERVICE_ROLE_KEY inválida')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
