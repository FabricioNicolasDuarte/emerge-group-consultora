export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'

export type MeetingProvider = 'jitsi' | 'zoom' | 'meet' | 'teams' | 'other'

export interface CoursePricing {
  price_amount: number
  price_currency: string
  is_paid?: boolean
}

export interface MyCertificate {
  id: string
  certificate_code: string
  issued_at: string
  course_id: string
  course_title: string
  course_slug: string
  course_category: string
  progress_percent: number
  enrollment_status: string
}

export interface AdminCertificate {
  id: string
  certificate_code: string
  issued_at: string
  enrollment_id: string
  student_name: string
  student_email: string | null
  course_title: string
  progress_percent: number
  enrollment_status: string
}

export interface CertificatePublic {
  certificate_code: string
  issued_at: string
  course_title: string
  course_category: string
  student_name: string
}

export interface LiveSession {
  id: string
  title: string
  session_date: string
  start_time: string | null
  end_time: string | null
  meeting_url: string
  meeting_provider: string
  course_id: string
  course_title: string
  course_slug: string
}

export interface PaymentHistoryRow {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  external_reference: string
  paid_at: string | null
  created_at: string
  course_id: string
  course_title: string
  course_slug: string
}

export interface AdminPaymentRow {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  external_reference: string
  mp_preference_id: string | null
  mp_payment_id: string | null
  paid_at: string | null
  created_at: string
  course_title: string
  student_name: string
  student_email: string | null
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

export const MEETING_PROVIDER_LABELS: Record<MeetingProvider, string> = {
  jitsi: 'Jitsi Meet',
  zoom: 'Zoom',
  meet: 'Google Meet',
  teams: 'Microsoft Teams',
  other: 'Otro',
}

export function formatCoursePrice(amount: number, currency = 'ARS') {
  if (!amount || amount <= 0) return 'Gratuito'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
