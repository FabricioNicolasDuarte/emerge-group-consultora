import { normalizeEmail, normalizePhone, requireCampusSuperadmin } from '../../../../utils/campus-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const { admin } = await requireCampusSuperadmin(event)
  const id = getRouterParam(event, 'id')
  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Id de usuario inválido' })
  }

  const body = await readBody<{
    fullName?: string
    email?: string
    password?: string
    phone?: string | null
    city?: string | null
    jobRole?: string | null
    occupation?: string | null
    audience?: string | null
    challenge?: string | null
    role?: 'alumno' | 'docente' | 'tutor'
  }>(event)

  const fullName = String(body?.fullName ?? '').trim()
  const email = normalizeEmail(body?.email)
  if (!fullName || !email) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre y correo son obligatorios' })
  }

  const password = String(body?.password ?? '')
  const authUpdate: Record<string, unknown> = {
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  }
  if (password.length >= 8) {
    authUpdate.password = password
  } else if (password.length > 0) {
    throw createError({ statusCode: 400, statusMessage: 'La contraseña debe tener al menos 8 caracteres' })
  }

  const { error: authError } = await admin.auth.admin.updateUserById(id, authUpdate)
  if (authError) {
    throw createError({ statusCode: 400, statusMessage: authError.message })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      email,
      phone: normalizePhone(body?.phone),
      city: body?.city?.trim() || null,
      job_role: body?.jobRole?.trim() || null,
      occupation: body?.occupation?.trim() || null,
      audience: body?.audience?.trim() || null,
      challenge: body?.challenge?.trim() || null,
    })
    .eq('id', id)

  if (profileError) {
    throw createError({ statusCode: 500, statusMessage: profileError.message })
  }

  if (body?.role === 'alumno' || body?.role === 'docente' || body?.role === 'tutor') {
    const { data: roleRows, error: rolesError } = await admin
      .from('roles')
      .select('id, slug')
      .in('slug', ['alumno', 'docente', 'tutor'])

    if (rolesError) {
      throw createError({ statusCode: 500, statusMessage: rolesError.message })
    }

    const target = (roleRows ?? []).find((r) => r.slug === body.role)
    const swapIds = (roleRows ?? []).map((r) => r.id)
    if (target && swapIds.length) {
      await admin.from('user_roles').delete().eq('user_id', id).in('role_id', swapIds)
      const { error: insertError } = await admin
        .from('user_roles')
        .insert({ user_id: id, role_id: target.id })
      if (insertError && !String(insertError.message).toLowerCase().includes('duplicate')) {
        throw createError({ statusCode: 500, statusMessage: insertError.message })
      }
    }
  }

  return { id, email, full_name: fullName }
})
