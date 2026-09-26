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

function isAlreadyRegisteredError(message: string) {
  const lower = message.toLowerCase()
  return lower.includes('already') || lower.includes('registered') || lower.includes('exists')
}

async function findUserIdByEmail(
  admin: ReturnType<typeof serverSupabaseServiceRole>,
  email: string,
): Promise<string | null> {
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (profile?.id) return assertUuid(profile.id, 'ID de perfil')

  // Fallback Auth (por si el perfil no tiene email sincronizado)
  const { data: listed, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) return null
  const match = (listed?.users ?? []).find((u) => (u.email || '').toLowerCase() === email)
  return match?.id ? assertUuid(match.id, 'ID de Auth') : null
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

  // Mantener roles de staff; reemplazar alumno/docente/tutor por el pedido.
  const { data: currentRoles, error: currentError } = await admin
    .from('user_roles')
    .select('role_id, roles!inner(slug)')
    .eq('user_id', safeUserId)

  if (currentError) {
    throw createError({
      statusCode: 500,
      statusMessage: `No se pudieron leer roles actuales: ${currentError.message}`,
    })
  }

  const keepSlugs = new Set(['superadmin', 'admin', 'coordinador'])
  const removeIds: number[] = []
  for (const row of currentRoles ?? []) {
    const roleMeta = row.roles as { slug?: string } | { slug?: string }[] | null
    const slug = Array.isArray(roleMeta) ? roleMeta[0]?.slug : roleMeta?.slug
    if (!slug || keepSlugs.has(slug) || slug === roleSlug) continue
    removeIds.push(row.role_id as number)
  }

  if (removeIds.length) {
    const { error: deleteError } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', safeUserId)
      .in('role_id', removeIds)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: `No se pudo actualizar roles previos: ${deleteError.message}`,
      })
    }
  }

  const { error: insertError } = await admin
    .from('user_roles')
    .upsert(
      { user_id: safeUserId, role_id: roleRow.id },
      { onConflict: 'user_id,role_id', ignoreDuplicates: true },
    )

  if (insertError) {
    const { error: rpcError } = await admin.rpc('dev_assign_campus_role', {
      p_user_id: safeUserId,
      p_role_slug: roleSlug,
    })
    if (rpcError) {
      throw createError({
        statusCode: 500,
        statusMessage: `No se pudo asignar el rol: ${insertError.message}`,
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

  if (!email || !fullName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nombre y correo son obligatorios',
    })
  }

  if (!ALLOWED_ROLES.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Rol no permitido' })
  }

  if (role === 'admin' && !slugs.includes('superadmin')) {
    throw createError({ statusCode: 403, statusMessage: 'Solo superadmin puede crear admins' })
  }

  let userId = await findUserIdByEmail(admin, email)
  let created = false
  let promoted = false

  if (!userId) {
    if (password.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Para un correo nuevo la contraseña es obligatoria (mín. 8 caracteres)',
      })
    }

    const { data: createdUser, error: authCreateError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authCreateError || !createdUser?.user) {
      const message = authCreateError?.message || 'No se pudo crear el usuario'
      if (isAlreadyRegisteredError(message)) {
        userId = await findUserIdByEmail(admin, email)
        if (!userId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'El correo ya existe en Auth pero no se pudo localizar el perfil. Revisá en Supabase.',
          })
        }
        promoted = true
      } else {
        throw createError({ statusCode: 400, statusMessage: message })
      }
    } else {
      userId = assertUuid(createdUser.user.id, 'ID del usuario creado')
      created = true
    }
  } else {
    promoted = true
  }

  userId = assertUuid(userId, 'ID de usuario')

  if (promoted && password.length >= 8) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(userId, { password })
    if (passwordError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Cuenta encontrada, pero no se pudo actualizar la contraseña: ${passwordError.message}`,
      })
    }
  }

  if (role !== 'alumno') {
    await assignCampusRole(admin, userId, role)
  }

  const profilePatch: Record<string, string | null> = {
    full_name: fullName,
    email,
  }
  if (phone !== null) profilePatch.phone = phone
  if (city !== null) profilePatch.city = city
  if (jobRole !== null) profilePatch.job_role = jobRole
  if (occupation !== null) profilePatch.occupation = occupation
  if (audience !== null) profilePatch.audience = audience
  if (challenge !== null) profilePatch.challenge = challenge

  const { error: profileError } = await admin
    .from('profiles')
    .update(profilePatch)
    .eq('id', userId)

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Rol ok, pero falló actualizar el perfil: ${profileError.message}`,
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
    created,
    promoted,
  }
})
