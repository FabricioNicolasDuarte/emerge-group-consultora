import { handleMercadoPagoWebhook } from '../../utils/payments'

export default defineEventHandler(async (event) => {
  return await handleMercadoPagoWebhook(event)
})
