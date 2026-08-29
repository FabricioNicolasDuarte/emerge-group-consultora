export type AnnouncementAudience = 'all' | 'students' | 'teachers' | 'course'
export type AnnouncementStatus = 'draft' | 'published' | 'archived'
export type AnnouncementMediaType = 'image' | 'video' | 'file'
export type AnnouncementLayoutStyle = 'card' | 'banner' | 'fullscreen'

export interface AnnouncementMedia {
  id: string
  media_type: AnnouncementMediaType
  storage_path: string
  public_url: string | null
  title: string
  mime_type: string | null
  sort_order: number
}

export interface CampusAnnouncement {
  id: string
  title: string
  body: string
  body_html?: string
  excerpt?: string
  background_color?: string
  accent_color?: string
  cover_image_path?: string | null
  layout_style?: AnnouncementLayoutStyle
  audience: AnnouncementAudience
  course_id: string | null
  is_pinned: boolean
  published_at: string | null
  expires_at: string | null
  course_title?: string | null
  course_slug?: string | null
  media?: AnnouncementMedia[]
}

export interface PublicAnnouncement {
  id: string
  title: string
  body: string
  body_html?: string
  excerpt?: string
  background_color?: string
  accent_color?: string
  cover_image_path?: string | null
  layout_style?: AnnouncementLayoutStyle
  is_pinned: boolean
  published_at: string | null
  media?: AnnouncementMedia[]
}

export interface AdminAnnouncement extends CampusAnnouncement {
  status: AnnouncementStatus
  created_at: string
  updated_at?: string
  design_json?: Record<string, unknown> | null
}

export interface CampusNotification {
  id: string
  title: string
  body: string
  notification_type: string
  link_url: string | null
  is_read: boolean
  created_at: string
}

export interface CreateAnnouncementInput {
  title: string
  body?: string
  body_html?: string
  design_json?: Record<string, unknown> | null
  excerpt?: string
  background_color?: string
  accent_color?: string
  cover_image_path?: string | null
  layout_style?: AnnouncementLayoutStyle
  audience?: AnnouncementAudience
  course_id?: string | null
  status?: AnnouncementStatus
  is_pinned?: boolean
  expires_at?: string | null
}

export interface UpdateAnnouncementInput extends CreateAnnouncementInput {
  id: string
}

export interface CreateNotificationInput {
  user_id: string
  title: string
  body?: string
  notification_type?: string
  link_url?: string | null
}

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: 'Todo el campus',
  students: 'Alumnos',
  teachers: 'Docentes',
  course: 'Curso específico',
}

export const LAYOUT_LABELS: Record<AnnouncementLayoutStyle, string> = {
  card: 'Tarjeta',
  banner: 'Banner ancho',
  fullscreen: 'Pantalla completa',
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  info: 'Información',
  enrollment: 'Inscripción',
  grade: 'Calificación',
  announcement: 'Anuncio',
  attendance: 'Asistencia',
  mailbox: 'Buzón',
}
