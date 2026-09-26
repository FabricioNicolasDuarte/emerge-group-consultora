import {
  generateTemporaryPassword,
  normalizeEmail,
  requireCampusStaff,
} from '../../../../utils/campus-admin'
import type { ApplicationCredential } from '~/types/applications'

export default defineEventHandler(async (event) => {
  const { admin } = await requireCampusStaff(event)
  const body = await readBody<{
    applicationIds?: string[]
    courseId?: string
    onlyReady?: boolean
  }>(event)

  const applicationIds = body?.applicationIds?.filter(Boolean) ?? []
  const courseId = body?.courseId?.trim() || null
  const onlyReady = body?.onlyReady !== false

  let query = admin
    .from('enrollment_applications')
    .select('*')
    .order('full_name')

  if (applicationIds.length) {
    query = query.in('id', applicationIds)
  } else if (courseId) {
    query = query.eq('course_id', courseId)
    if (onlyReady) query = query.eq('status', 'ready')
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'Indicá applicationIds o courseId',
    })
  }

  const { data: applications, error } = await query
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const list = (applications ?? []).filter((row) => {
    if (row.status === 'converted') return false
    if (onlyReady && row.status !== 'ready') return false
    return Boolean(row.email && row.course_id)
  })

  if (!list.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No hay solicitudes listas para convertir',
    })
  }

  const credentials: ApplicationCredential[] = []
  const errors: string[] = []

  for (const app of list) {
    const email = normalizeEmail(app.email)
    try {
      let userId: string | null = null
      let created = false
      let temporaryPassword = ''

      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle()

      if (existingProfile?.id) {
        userId = existingProfile.id
      } else {
        temporaryPassword = generateTemporaryPassword()
        const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
          email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: { full_name: app.full_name },
        })
        if (createError || !createdUser.user) {
          throw new Error(createError?.message || 'No se pudo crear el usuario')
        }
        userId = createdUser.user.id
        created = true
      }

      await admin
        .from('profiles')
        .update({
          full_name: app.full_name,
          email,
          phone: app.phone,
          city: app.city,
          job_role: app.job_role,
          occupation: app.occupation,
          audience: app.audience,
          challenge: app.challenge,
        })
        .eq('id', userId)

      let enrollmentId: string | null = null
      let enrolled = false
      if (app.course_id) {
        const { data: existingEnrollment } = await admin
          .from('enrollments')
          .select('id')
          .eq('course_id', app.course_id)
          .eq('student_id', userId)
          .maybeSingle()

        if (existingEnrollment?.id) {
          enrollmentId = existingEnrollment.id
          enrolled = true
        } else {
          const { data: enrollment, error: enrollError } = await admin
            .from('enrollments')
            .insert({
              course_id: app.course_id,
              student_id: userId,
              status: 'active',
            })
            .select('id')
            .single()
          if (enrollError) throw new Error(enrollError.message)
          enrollmentId = enrollment.id
          enrolled = true
        }
      }

      await admin
        .from('enrollment_applications')
        .update({
          status: 'converted',
          converted_user_id: userId,
          enrollment_id: enrollmentId,
        })
        .eq('id', app.id)

      credentials.push({
        application_id: app.id,
        full_name: app.full_name,
        email,
        temporary_password: created ? temporaryPassword : '(ya tenía cuenta)',
        created,
        enrolled,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      errors.push(`${email}: ${message}`)
    }
  }

  return {
    converted: credentials.length,
    failed: errors.length,
    errors,
    credentials,
  }
})
