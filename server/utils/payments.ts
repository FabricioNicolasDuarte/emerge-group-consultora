import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { resolveAuthUserId } from './campus-admin'
import { createMercadoPagoPreference, fetchMercadoPagoPayment, mapMercadoPagoStatus } from '../utils/mercadopago'

function buildExternalReference(courseId: string, studentId: string) {
  return `campus-${courseId}-${studentId}-${Date.now()}`
}

export async function handleCreatePaymentPreference(event: H3Event, courseId: string) {
  const config = useRuntimeConfig(event)
  const accessToken = config.mercadopagoAccessToken as string

  if (!accessToken) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Mercado Pago no está configurado en el servidor',
    })
  }

  const claims = await serverSupabaseUser(event) as Record<string, unknown> | null
  const userId = resolveAuthUserId(claims)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, price_amount, price_currency, status')
    .eq('id', courseId)
    .maybeSingle()

  if (courseError) throw courseError
  if (!course || course.status !== 'published') {
    throw createError({ statusCode: 404, statusMessage: 'Curso no disponible' })
  }

  if (!course.price_amount || course.price_amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Este curso es gratuito' })
  }

  const { error: availabilityError } = await supabase.rpc('assert_course_enrollment_available', {
    p_course_id: courseId,
  })
  if (availabilityError) {
    throw createError({
      statusCode: 409,
      statusMessage: availabilityError.message || 'No hay cupos disponibles',
    })
  }

  const externalReference = buildExternalReference(course.id, userId)

  const { data: paymentRow, error: paymentError } = await supabase
    .from('course_payments')
    .insert({
      course_id: course.id,
      student_id: userId,
      amount: course.price_amount,
      currency: course.price_currency ?? 'ARS',
      status: 'pending',
      external_reference: externalReference,
    })
    .select()
    .single()

  if (paymentError) throw paymentError

  const appUrl = config.public.appUrl || 'http://localhost:3000'
  const useSandbox = config.mercadopagoSandbox === 'true' || config.mercadopagoSandbox === true

  const slugParam = encodeURIComponent(course.slug)
  const preference = await createMercadoPagoPreference(accessToken, {
    items: [
      {
        title: course.title,
        quantity: 1,
        unit_price: Number(course.price_amount),
        currency_id: course.price_currency ?? 'ARS',
      },
    ],
    external_reference: externalReference,
    notification_url: `${appUrl}/api/payments/webhook`,
    back_urls: {
      success: `${appUrl}/campus/pagos/resultado?status=success&ref=${externalReference}&slug=${slugParam}`,
      failure: `${appUrl}/campus/pagos/resultado?status=failure&ref=${externalReference}&slug=${slugParam}`,
      pending: `${appUrl}/campus/pagos/resultado?status=pending&ref=${externalReference}&slug=${slugParam}`,
    },
    auto_return: 'approved',
    payer: {
      email: user.email ?? undefined,
    },
  }, useSandbox)

  await supabase
    .from('course_payments')
    .update({ mp_preference_id: preference.preferenceId })
    .eq('id', paymentRow.id)

  return {
    initPoint: preference.initPoint,
    externalReference,
  }
}

export async function handleMercadoPagoWebhook(event: H3Event) {
  const config = useRuntimeConfig(event)
  const accessToken = config.mercadopagoAccessToken as string

  if (!accessToken) {
    throw createError({ statusCode: 503, statusMessage: 'Mercado Pago no configurado' })
  }

  const query = getQuery(event)
  const paymentId = String(query.id || query['data.id'] || '')

  if (!paymentId) {
    return { ok: true, skipped: true }
  }

  const payment = await fetchMercadoPagoPayment(accessToken, paymentId)
  const supabase = serverSupabaseServiceRole(event)

  if (payment.external_reference && payment.status === 'approved') {
    await supabase.rpc('fulfill_course_payment', {
      p_external_reference: payment.external_reference,
      p_mp_payment_id: String(payment.id),
    })
  } else if (payment.external_reference) {
    const mappedStatus = mapMercadoPagoStatus(payment.status)
    await supabase
      .from('course_payments')
      .update({
        status: mappedStatus,
        mp_payment_id: String(payment.id),
        updated_at: new Date().toISOString(),
      })
      .eq('external_reference', payment.external_reference)
  }

  return { ok: true }
}
