import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { CampusRoleSlug } from '~/types/campus'

const ALLOWED_ROLES: CampusRoleSlug[] = ['alumno', 'docente', 'tutor', 'coordinador', 'admin']
const STAFF_SLUGS = ['superadmin', 'admin', 'coordinador'] as const

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

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError || !created.user) {
    throw createError({
      statusCode: 400,
      statusMessage: createError?.message || 'No se pudo crear el usuario',
    })
  }

  // El trigger ya asigna rol alumno. Si pidieron otro, lo reemplazamos.
  if (role !== 'alumno') {
    const { error: roleError } = await admin.rpc('dev_assign_campus_role', {
      p_user_id: created.user.id,
      p_role_slug: role,
    })
    if (roleError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Usuario creado, pero falló el rol: ${roleError.message}`,
      })
    }
  }

  await admin
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
    .eq('id', created.user.id)

  return {
    id: created.user.id,
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
