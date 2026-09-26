import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

const STAFF_SLUGS = ['superadmin', 'admin', 'coordinador'] as const

export async function requireCampusStaff(event: H3Event) {
  const caller = await serverSupabaseUser(event)
  if (!caller) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const admin = serverSupabaseServiceRole(event)
  const { data: callerRoles, error: rolesError } = await admin
    .from('user_roles')
    .select('roles!inner(slug)')
    .eq('user_id', caller.id)

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

  return { caller, admin, slugs }
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
