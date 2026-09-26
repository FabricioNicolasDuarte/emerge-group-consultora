import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

const STAFF_SLUGS = ['superadmin', 'admin', 'coordinador'] as const

export async function requireCampusStaff(event: H3Event) {
  const caller = await serverSupabaseUser(event)
  if (!caller?.id) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  // Evita el error Postgres: invalid input syntax for type uuid: "undefined"
  const callerId = String(caller.id)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(callerId)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sesión inválida (sin id de usuario). Cerrá sesión y volvé a ingresar.',
    })
  }

  const admin = serverSupabaseServiceRole(event)
  const { data: callerRoles, error: rolesError } = await admin
    .from('user_roles')
    .select('roles!inner(slug)')
    .eq('user_id', callerId)

  if (rolesError) {
    throw createError({ statusCode: 500, statusMessage: rolesError.message })
  }

  const slugs = (callerRoles ?? []).flatMap((row) => {
    const roles = row.roles as { slug?: string } | { slug?: string }[] | null
    if (!roles) return []
    if (Array.isArray(roles)) return roles.map((r) => r.slug).filter(Boolean) as string[]
    return roles.slug ? [roles.slug] : []
  })

  if (!slugs.some((slug) => (STAFF_SLUGS as readonly string[]).includes(slug))) {
    throw createError({ statusCode: 403, statusMessage: 'Sin permiso de administración' })
  }

  return { caller: { ...caller, id: callerId }, admin, slugs }
}

export function generateTemporaryPassword(length = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length]
  }
  return `${out}!`
}

export function normalizePhone(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    return String(Math.trunc(value))
  }
  const text = String(value).trim()
  return text || null
}

export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}
