import { handleCreatePaymentPreference } from '../../utils/payments'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ courseId?: string }>(event)

  if (!body?.courseId) {
    throw createError({ statusCode: 400, statusMessage: 'courseId requerido' })
  }

  return await handleCreatePaymentPreference(event, body.courseId)
})
