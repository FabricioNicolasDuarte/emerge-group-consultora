import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { CampusRoleSlug } from '~/types/campus'

const ALLOWED_ROLES: CampusRoleSlug[] = ['alumno', 'docente', 'tutor', 'coordinador', 'admin']
const STAFF_SLUGS = ['superadmin', 'admin', 'coordinador'] as const
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function assertUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw createError({
      statusCode: 500,
      statusMessage: `${label} inválido (${String(value)})`,
    })
  }
  return value
}

async function assignCampusRole(
  admin: ReturnType<typeof serverSupabaseServiceRole>,
  userId: string,
  roleSlug: CampusRoleSlug,
) {
  const safeUserId = assertUuid(userId, 'ID de usuario')

  const { data: roleRow, error: roleLookupError } = await admin
    .from('roles')
    .select('id')
    .eq('slug', roleSlug)
    .maybeSingle()

  if (roleLookupError) {
    throw createError({
      statusCode: 500,
      statusMessage: `No se pudo leer el rol «${roleSlug}»: ${roleLookupError.message}`,
    })
  }

  if (roleRow?.id == null) {
    throw createError({
      statusCode: 500,
      statusMessage: `Rol «${roleSlug}» no encontrado en la base`,
    })
  }

  // Reemplazar roles previos (el trigger deja «alumno» al crear la cuenta).
  const { error: deleteError } = await admin
    .from('user_roles')
    .delete()
    .eq('user_id', safeUserId)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: `No se pudo limpiar roles previos: ${deleteError.message}`,
    })
  }

  const { error: insertError } = await admin
    .from('user_roles')
    .insert({ user_id: safeUserId, role_id: roleRow.id })

  if (insertError) {
    // Fallback a RPC solo si el insert directo falla por RLS/permisos
    const { error: rpcError } = await admin.rpc('dev_assign_campus_role', {
      p_user_id: safeUserId,
      p_role_slug: roleSlug,
    })
    if (rpcError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Usuario creado, pero falló el rol: ${insertError.message}`,
      })
    }
  }
}

export default defineEventHandler(async (event) => {
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
    throw createError({ statusCode: 403, statusMessage: 'Sin permiso para crear usuarios' })
  }

  const body = await readBody<{
    email?: string
    fullName?: string
    password?: string
    role?: CampusRoleSlug
    phone?: string
    city?: string
    jobRole?: string
    occupation?: string
    audience?: string
    challenge?: string
  }>(event)

  const email = body?.email?.trim().toLowerCase() ?? ''
  const fullName = body?.fullName?.trim() ?? ''
  const password = body?.password ?? ''
  const phone = body?.phone?.trim() || null
  const city = body?.city?.trim() || null
  const jobRole = body?.jobRole?.trim() || null
  const occupation = body?.occupation?.trim() || null
  const audience = body?.audience?.trim() || null
  const challenge = body?.challenge?.trim() || null
  const role = (body?.role ?? 'alumno') as CampusRoleSlug

  if (!email || !fullName || password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nombre, correo y contraseña (mín. 8) son obligatorios',
    })
  }

  if (!ALLOWED_ROLES.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Rol no permitido' })
  }

  if (role === 'admin' && !slugs.includes('superadmin')) {
    throw createError({ statusCode: 403, statusMessage: 'Solo superadmin puede crear admins' })
  }

  const { data: created, error: authCreateError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authCreateError || !created?.user) {
    throw createError({
      statusCode: 400,
      statusMessage: authCreateError?.message || 'No se pudo crear el usuario',
    })
  }

  const userId = assertUuid(created.user.id, 'ID del usuario creado')

  if (role !== 'alumno') {
    await assignCampusRole(admin, userId, role)
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      email,
      phone,
      city,
      job_role: jobRole,
      occupation,
      audience,
      challenge,
    })
    .eq('id', userId)

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Usuario creado, pero falló el perfil: ${profileError.message}`,
    })
  }

  return {
    id: userId,
    email,
    full_name: fullName,
    phone,
    city,
    job_role: jobRole,
    occupation,
    audience,
    challenge,
    role,
  }
})
