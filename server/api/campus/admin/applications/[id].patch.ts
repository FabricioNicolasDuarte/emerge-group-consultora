import { requireCampusStaff } from '../../../../utils/campus-admin'
import type { ApplicationStatus } from '~/types/applications'

const ALLOWED: ApplicationStatus[] = ['ready', 'pending', 'rejected', 'duplicate']

export default defineEventHandler(async (event) => {
  const { admin } = await requireCampusStaff(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id requerido' })
  }

  const body = await readBody<{ status?: ApplicationStatus, notes?: string }>(event)
  const status = body?.status
  if (!status || !ALLOWED.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  }

  const { data: current, error: currentError } = await admin
    .from('enrollment_applications')
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (currentError || !current) {
    throw createError({ statusCode: 404, statusMessage: 'Solicitud no encontrada' })
  }
  if (current.status === 'converted') {
    throw createError({ statusCode: 400, statusMessage: 'No se puede cambiar una solicitud ya convertida' })
  }

  const patch: Record<string, unknown> = { status }
  if (typeof body?.notes === 'string') patch.notes = body.notes

  const { data, error } = await admin
    .from('enrollment_applications')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
