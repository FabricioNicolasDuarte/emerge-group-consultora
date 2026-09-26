import { randomUUID } from 'node:crypto'
import { requireCampusStaff } from '../../../../utils/campus-admin'
import { parseEnrollmentExcel } from '../../../../utils/enrollment-excel'

export default defineEventHandler(async (event) => {
  const { caller, admin } = await requireCampusStaff(event)
  const form = await readMultipartFormData(event)

  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Enviá un archivo Excel (.xlsx)' })
  }

  const filePart = form.find((part) => part.name === 'file' && part.data)
  const coursePart = form.find((part) => part.name === 'courseId')
  const courseId = coursePart?.data ? Buffer.from(coursePart.data).toString('utf8').trim() : ''

  if (!filePart?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Archivo Excel requerido' })
  }
  if (!courseId) {
    throw createError({ statusCode: 400, statusMessage: 'courseId requerido' })
  }

  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .maybeSingle()

  if (courseError || !course) {
    throw createError({ statusCode: 404, statusMessage: 'Curso no encontrado' })
  }

  const rows = await parseEnrollmentExcel(Buffer.from(filePart.data))
  if (!rows.length) {
    throw createError({ statusCode: 400, statusMessage: 'No se encontraron filas válidas en el Excel' })
  }

  const batchId = randomUUID()
  let inserted = 0
  let updated = 0
  let ready = 0
  let pending = 0

  for (const row of rows) {
    if (row.status === 'ready') ready++
    else pending++

    const payload = {
      course_id: courseId,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      audience: row.audience,
      challenge: row.challenge,
      job_role: row.job_role,
      occupation: row.occupation,
      city: row.city,
      status: row.status,
      source: 'excel_import',
      import_batch_id: batchId,
      created_by: caller.id,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await admin
      .from('enrollment_applications')
      .select('id, status')
      .eq('course_id', courseId)
      .ilike('email', row.email)
      .maybeSingle()

    if (existing?.id) {
      // No pisar convertidos
      if (existing.status === 'converted') {
        continue
      }
      const { error } = await admin
        .from('enrollment_applications')
        .update(payload)
        .eq('id', existing.id)
      if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
      }
      updated++
    } else {
      const { error } = await admin
        .from('enrollment_applications')
        .insert(payload)
      if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
      }
      inserted++
    }
  }

  return {
    batchId,
    course: { id: course.id, title: course.title },
    totalRows: rows.length,
    inserted,
    updated,
    ready,
    pending,
  }
})
