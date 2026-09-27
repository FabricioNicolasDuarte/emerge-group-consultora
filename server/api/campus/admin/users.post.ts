import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import type { CampusRoleSlug } from '~/types/campus'
import { requireCampusStaff } from '../../../utils/campus-admin'

const ALLOWED_ROLES: CampusRoleSlug[] = ['alumno', 'docente', 'tutor', 'coordinador', 'admin']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function serviceClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  const url = String(config.public.supabase?.url || process.env.NUXT_PUBLIC_SUPABASE_URL || '')
  const key = String(
    config.supabase?.secretKey
    || config.supabase?.serviceKey
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NUXT_SUPABASE_SECRET_KEY
    || '',
  )
  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Falta SUPABASE_SERVICE_ROLE_KEY (o NUXT_SUPABASE_SECRET_KEY) en el servidor',
    })
  }
  return {
    url,
    key,
    admin: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
  }
}

function requireUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw createError({
      statusCode: 500,
      statusMessage: `${label}: se recibió un id inválido (${String(value)})`,
    })
  }
  return value
}

function isAlreadyRegisteredError(message: string) {
  const lower = message.toLowerCase()
  return lower.includes('already') || lower.includes('registered') || lower.includes('exists')
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
  url: string,
  key: string,
): Promise<string | null> {
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (typeof profile?.id === 'string' && UUID_RE.test(profile.id)) {
    return profile.id
  }

  // Búsqueda directa en Auth Admin
  const endpoint = `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`
  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
  })
  if (res.ok) {
    const payload = await res.json() as { users?: Array<{ id?: string, email?: string }> } | Array<{ id?: string, email?: string }>
    const users = Array.isArray(payload) ? payload : (payload.users ?? [])
    const match = users.find((u) => (u.email || '').toLowerCase() === email)
    if (typeof match?.id === 'string' && UUID_RE.test(match.id)) return match.id
  }

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) break
    const users = data?.users ?? []
    const match = users.find((u) => (u.email || '').toLowerCase() === email)
    if (match?.id && UUID_RE.test(match.id)) return match.id
    if (users.length < 200) break
  }

  return null
}

async function assignTeachingRole(
  admin: ReturnType<typeof createClient>,
  userId: string,
  roleSlug: CampusRoleSlug,
) {
  const safeUserId = requireUuid(userId, 'Asignar rol')

  const { data: roleRows, error: rolesError } = await admin
    .from('roles')
    .select('id, slug')
    .in('slug', ['alumno', 'docente', 'tutor', roleSlug])

  if (rolesError) {
    throw createError({
      statusCode: 500,
      statusMessage: `No se pudieron leer roles: ${rolesError.message}`,
    })
  }

  const target = (roleRows ?? []).find((r) => r.slug === roleSlug)
  if (target?.id == null) {
    throw createError({
      statusCode: 500,
      statusMessage: `Rol «${roleSlug}» no existe en la tabla roles`,
    })
  }

  const swapIds = (roleRows ?? [])
    .filter((r) => r.slug === 'alumno' || r.slug === 'docente' || r.slug === 'tutor')
    .map((r) => r.id)
    .filter((id) => id != null)

  if (swapIds.length) {
    const { error: deleteError } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', safeUserId)
      .in('role_id', swapIds)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: `No se pudo limpiar roles previos: ${deleteError.message}`,
      })
    }
  }

  const { error: insertError } = await admin
    .from('user_roles')
    .insert({ user_id: safeUserId, role_id: target.id })

  if (insertError) {
    // Si ya estaba, ignorar conflicto de unique
    if (!String(insertError.message || '').toLowerCase().includes('duplicate')) {
      throw createError({
        statusCode: 500,
        statusMessage: `No se pudo insertar rol «${roleSlug}»: ${insertError.message}`,
      })
    }
  }
}

export default defineEventHandler(async (event) => {
  await requireCampusStaff(event)
  const { admin, url, key } = serviceClient(event)

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

  const email = String(body?.email ?? '').trim().toLowerCase()
  const fullName = String(body?.fullName ?? '').trim()
  const password = String(body?.password ?? '')
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

  let userId = await findUserIdByEmail(admin, email, url, key)
  let created = false
  let promoted = false

  if (userId) {
    promoted = true
    if (password.length >= 8) {
      const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      })
      if (passwordError) {
        throw createError({
          statusCode: 500,
          statusMessage: `Cuenta existente: no se pudo actualizar contraseña (${passwordError.message})`,
        })
      }
    }
  } else {
    if (password.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Correo nuevo: la contraseña es obligatoria (mín. 8 caracteres)',
      })
    }

    const { data: createdUser, error: authCreateError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authCreateError || !createdUser?.user?.id) {
      const message = authCreateError?.message || 'No se pudo crear el usuario'
      if (isAlreadyRegisteredError(message)) {
        userId = await findUserIdByEmail(admin, email, url, key)
        if (!userId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'El correo figura en Auth pero no se pudo obtener su id. Revisá usuarios en Supabase.',
          })
        }
        promoted = true
        if (password.length >= 8) {
          await admin.auth.admin.updateUserById(userId, { password, email_confirm: true })
        }
      } else {
        throw createError({ statusCode: 400, statusMessage: message })
      }
    } else {
      userId = requireUuid(createdUser.user.id, 'Usuario creado')
      created = true
    }
  }

  userId = requireUuid(userId, 'Usuario final')

  if (role !== 'alumno') {
    await assignTeachingRole(admin, userId, role)
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
      statusMessage: `Rol ok, pero falló el perfil: ${profileError.message}`,
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
