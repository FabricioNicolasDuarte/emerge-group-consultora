interface MercadoPagoPreferenceItem {
  title: string
  quantity: number
  unit_price: number
  currency_id: string
}

interface MercadoPagoPreferencePayload {
  items: MercadoPagoPreferenceItem[]
  external_reference: string
  notification_url?: string
  back_urls?: {
    success?: string
    failure?: string
    pending?: string
  }
  auto_return?: 'approved' | 'all'
  payer?: {
    email?: string
  }
}

interface MercadoPagoPreferenceResponse {
  id: string
  init_point: string
  sandbox_init_point?: string
}

interface MercadoPagoPaymentResponse {
  id: number
  status: string
  external_reference?: string
}

export async function createMercadoPagoPreference(
  accessToken: string,
  payload: MercadoPagoPreferencePayload,
  useSandbox = false,
) {
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Mercado Pago preference error: ${body}`)
  }

  const data = await response.json() as MercadoPagoPreferenceResponse
  return {
    preferenceId: data.id,
    initPoint: useSandbox && data.sandbox_init_point ? data.sandbox_init_point : data.init_point,
  }
}

export async function fetchMercadoPagoPayment(accessToken: string, paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Mercado Pago payment error: ${body}`)
  }

  return await response.json() as MercadoPagoPaymentResponse
}

export function mapMercadoPagoStatus(status: string) {
  if (status === 'approved') return 'approved' as const
  if (status === 'rejected') return 'rejected' as const
  if (status === 'cancelled') return 'cancelled' as const
  if (status === 'refunded') return 'refunded' as const
  return 'pending' as const
}
