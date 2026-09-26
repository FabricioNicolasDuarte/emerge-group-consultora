import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import type { CampusRoleSlug } from '~/types/campus'
import { normalizeEmail, requireCampusStaff } from '~/server/utils/campus-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TEACHING_ROLES: CampusRoleSlug[] = ['docente', 'tutor']

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

function assertUuid(value: unknown, label: string): string {
  if (!isUuid(value)) {
    throw createError({
      statusCode: 500,
      statusMessage: `${label}: id inválido (${String(value)}). No se envió nada a la base.`,
    })
  }
  return value
}

function getServiceCredentials(event: H3Event) {
  const config = useRuntimeConfig(event)
  const url = String(config.public?.supabase?.url || process.env.NUXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = String(
    config.supabase?.secretKey
    || config.supabase?.serviceKey
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NUXT_SUPABASE_SECRET_KEY
    || '',
  ).trim()

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configuración incompleta: falta URL de Supabase o SUPABASE_SERVICE_ROLE_KEY en Vercel',
    })
  }

  return { url, key }
}

function isAlreadyRegisteredError(message: string) {
  const lower = message.toLowerCase()
  return lower.includes('already')
    || lower.includes('registered')
    || lower.includes('exists')
    || lower.includes('duplicate')
}

async function findUserIdByEmail(admin: SupabaseClient, email: string, url: string, key: string) {
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (isUuid(profile?.id)) return profile.id

  const res = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
  })

  if (res.ok) {
    const payload = await res.json() as { users?: Array<{ id?: string, email?: string }> }
    const match = (payload.users ?? []).find((u) => (u.email || '').toLowerCase() === email)
    if (isUuid(match?.id)) return match.id
  }

  return null
}

async function setTeachingRole(admin: SupabaseClient, userId: string, roleSlug: 'docente' | 'tutor') {
  const safeUserId = assertUuid(userId, 'Asignación de rol')

  const { data: roleRows, error: rolesError } = await admin
    .from('roles')
    .select('id, slug')
    .in('slug', ['alumno', 'docente', 'tutor'])

  if (rolesError) {
    throw createError({ statusCode: 500, statusMessage: `Roles: ${rolesError.message}` })
  }

  const target = (roleRows ?? []).find((row) => row.slug === roleSlug)
  if (target?.id == null) {
    throw createError({ statusCode: 500, statusMessage: `No existe el rol «${roleSlug}»` })
  }

  const swapIds = (roleRows ?? [])
    .map((row) => row.id)
    .filter((id): id is number => typeof id === 'number' || typeof id === 'string')

  if (swapIds.length) {
    const { error: deleteError } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', safeUserId)
      .in('role_id', swapIds)

    if (deleteError) {
      throw createError({ statusCode: 500, statusMessage: `Limpiar roles: ${deleteError.message}` })
    }
  }

  const { error: insertError } = await admin
    .from('user_roles')
    .insert({
      user_id: safeUserId,
      role_id: target.id,
    })

  if (insertError && !String(insertError.message).toLowerCase().includes('duplicate')) {
    throw createError({ statusCode: 500, statusMessage: `Insertar rol: ${insertError.message}` })
  }
}

/**
 * Alta o promoción de docente/tutor.
 * - Si el correo no existe: crea Auth + perfil + rol (password obligatoria).
 * - Si ya existe: asigna/actualiza rol docente|tutor (password opcional = reset).
 */
export default defineEventHandler(async (event) => {
  const { caller } = await requireCampusStaff(event)
  assertUuid(caller.id, 'Sesión admin')

  const { url, key } = getServiceCredentials(event)
  // Cliente fresco con service role (evita rarezas del helper en algunos deploys)
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const body = await readBody<{
    email?: string
    fullName?: string
    password?: string
    role?: CampusRoleSlug
  }>(event)

  const email = normalizeEmail(body?.email)
  const fullName = String(body?.fullName ?? '').trim()
  const password = String(body?.password ?? '')
  const role = (body?.role === 'tutor' ? 'tutor' : 'docente') as 'docente' | 'tutor'

  if (!email || !fullName) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre y correo son obligatorios' })
  }
  if (!TEACHING_ROLES.includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Rol inválido (docente o tutor)' })
  }

  let userId = await findUserIdByEmail(admin, email, url, key)
  let created = false
  let promoted = false

  if (userId) {
    promoted = true
    if (password.length >= 8) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (error) {
        throw createError({ statusCode: 500, statusMessage: `Reset de clave: ${error.message}` })
      }
    }
  } else {
    if (password.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Correo nuevo: ingresá una contraseña de al menos 8 caracteres',
      })
    }

    const { data: createdUser, error: createErrorAuth } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createErrorAuth || !isUuid(createdUser?.user?.id)) {
      const message = createErrorAuth?.message || 'No se pudo crear el usuario'
      if (isAlreadyRegisteredError(message)) {
        userId = await findUserIdByEmail(admin, email, url, key)
        if (!userId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Ese correo ya está en Auth pero no se pudo leer su id. Probá de nuevo en 10s.',
          })
        }
        promoted = true
        if (password.length >= 8) {
          await admin.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName },
          })
        }
      } else {
        throw createError({ statusCode: 400, statusMessage: message })
      }
    } else {
      userId = createdUser!.user!.id
      created = true
    }
  }

  userId = assertUuid(userId, 'Usuario')

  await setTeachingRole(admin, userId, role)

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      email,
    })
    .eq('id', userId)

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Rol asignado, pero falló actualizar perfil: ${profileError.message}`,
    })
  }

  return {
    id: userId,
    email,
    full_name: fullName,
    role,
    created,
    promoted,
  }
})
