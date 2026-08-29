import type {
  AdminCertificate,
  AdminPaymentRow,
  LiveSession,
  MyCertificate,
  PaymentHistoryRow,
} from '~/types/commerce'

export function useCampusCommerce() {
  const supabase = useSupabaseClient()

  async function enrollFree(courseId: string) {
    const { data, error } = await supabase.rpc('enroll_self', { p_course_id: courseId })
    if (error) throw error
    return data as string
  }

  async function createPaymentPreference(courseId: string) {
    return await $fetch<{ initPoint: string, externalReference: string }>('/api/payments/create-preference', {
      method: 'POST',
      body: { courseId },
    })
  }

  async function fetchMyCertificates() {
    const { data, error } = await supabase.from('my_certificates').select('*')
    if (error) throw error
    return (data ?? []) as MyCertificate[]
  }

  async function fetchAdminCertificates() {
    const { data, error } = await supabase.from('admin_certificates').select('*')
    if (error) throw error
    return (data ?? []) as AdminCertificate[]
  }

  async function fetchCertificateByCode(code: string) {
    const { data, error } = await supabase.rpc('get_certificate_by_code', { p_code: code })
    if (error) throw error
    return (data?.[0] ?? null) as {
      certificate_code: string
      issued_at: string
      course_title: string
      course_category: string
      student_name: string
    } | null
  }

  async function issueCertificateManual(enrollmentId: string) {
    const { data, error } = await supabase.rpc('issue_certificate_manual', {
      p_enrollment_id: enrollmentId,
    })
    if (error) throw error
    return data as string
  }

  async function fetchUpcomingLiveSessions() {
    const { data, error } = await supabase.from('upcoming_live_sessions').select('*')
    if (error) throw error
    return (data ?? []) as LiveSession[]
  }

  async function fetchMyPayments() {
    const { data, error } = await supabase.from('my_payment_history').select('*')
    if (error) throw error
    return (data ?? []) as PaymentHistoryRow[]
  }

  async function fetchAdminPayments() {
    const { data, error } = await supabase.from('admin_payments').select('*')
    if (error) throw error
    return (data ?? []) as AdminPaymentRow[]
  }

  async function updateCoursePricing(courseId: string, priceAmount: number, priceCurrency = 'ARS') {
    const { data, error } = await supabase
      .from('courses')
      .update({
        price_amount: priceAmount,
        price_currency: priceCurrency,
      })
      .eq('id', courseId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  return {
    enrollFree,
    createPaymentPreference,
    fetchMyCertificates,
    fetchAdminCertificates,
    fetchCertificateByCode,
    issueCertificateManual,
    fetchUpcomingLiveSessions,
    fetchMyPayments,
    fetchAdminPayments,
    updateCoursePricing,
  }
}
