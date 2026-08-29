export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'published'
  | 'status_changed'

export type AuditEntityType =
  | 'course'
  | 'enrollment'
  | 'grade'
  | 'announcement'
  | 'attendance'
  | 'mailbox_thread'
  | 'mailbox_message'

export interface ActivityLogEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  course_id: string | null
  summary: string
  metadata: Record<string, unknown>
  created_at: string
  actor_id: string | null
  actor_name: string | null
  actor_email: string | null
  course_title: string | null
}

export interface ActivityFilters {
  action?: string
  entity_type?: string
  course_id?: string
  days?: number
  limit?: number
}

export interface CampusReportSummary {
  published_courses: number
  active_enrollments: number
  completed_enrollments: number
  avg_progress_percent: number
  unique_students: number
  activity_last_30_days: number
  attendance_rate_percent: number
  avg_grade: number
}

export interface CoursePerformanceRow {
  course_id: string
  course_title: string
  category: string
  status: string
  active_enrollments: number
  completed_enrollments: number
  avg_progress_percent: number
  attendance_rate_percent: number
  avg_grade: number
}

export interface EnrollmentReportRow {
  id: string
  enrolled_at: string
  completed_at: string | null
  status: string
  progress_percent: number
  student_id: string
  student_name: string
  student_email: string | null
  course_id: string
  course_title: string
  course_category: string
}

export const ACTION_LABELS: Record<string, string> = {
  created: 'Creado',
  updated: 'Actualizado',
  deleted: 'Eliminado',
  published: 'Publicado',
  status_changed: 'Estado cambiado',
  archived: 'Archivado',
  unarchived: 'Restaurado',
}

export const ENTITY_LABELS: Record<string, string> = {
  course: 'Curso',
  enrollment: 'Inscripción',
  grade: 'Calificación',
  announcement: 'Anuncio',
  attendance: 'Asistencia',
  mailbox_thread: 'Conversación',
  mailbox_message: 'Mensaje',
}
