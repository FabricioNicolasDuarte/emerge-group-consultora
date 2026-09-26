export type ApplicationStatus =
  | 'ready'
  | 'pending'
  | 'converted'
  | 'rejected'
  | 'duplicate'

export interface EnrollmentApplication {
  id: string
  course_id: string | null
  full_name: string
  email: string
  phone: string | null
  audience: string | null
  challenge: string | null
  job_role: string | null
  occupation: string | null
  city: string | null
  status: ApplicationStatus
  source: string
  import_batch_id: string | null
  notes: string | null
  converted_user_id: string | null
  enrollment_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  course_title?: string | null
  course_slug?: string | null
  converted_user_name?: string | null
}

export interface ApplicationImportRow {
  full_name: string
  email: string
  phone?: string | null
  audience?: string | null
  challenge?: string | null
  job_role?: string | null
  occupation?: string | null
  city?: string | null
  status: Extract<ApplicationStatus, 'ready' | 'pending'>
  row_number: number
}

export interface ApplicationCredential {
  application_id: string
  full_name: string
  email: string
  temporary_password: string
  created: boolean
  enrolled: boolean
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  ready: 'Listo para usuario',
  pending: 'En duda',
  converted: 'Convertido',
  rejected: 'Rechazado',
  duplicate: 'Duplicado',
}
