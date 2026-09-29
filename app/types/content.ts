export type LessonContentType = 'video' | 'activity' | 'document' | 'reading'

export interface CourseRow {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: 'draft' | 'published' | 'archived'
  cover_image_url: string | null
  price_amount?: number
  price_currency?: string
  cohort_start_date?: string | null
  cohort_end_date?: string | null
  enrollment_cap?: number | null
  enrollment_starts_at?: string | null
  enrollment_ends_at?: string | null
}

export interface ModuleRow {
  id: string
  course_id: string
  title: string
  description: string
  sort_order: number
  lessons?: LessonRow[]
}

export interface LessonRow {
  id: string
  module_id: string
  title: string
  description: string
  content_type: LessonContentType
  video_url: string | null
  content_html: string
  duration_minutes: number | null
  sort_order: number
  is_published: boolean
}

export interface LessonMaterial {
  id: string
  lesson_id: string
  title: string
  storage_path: string
  mime_type: string | null
  sort_order: number
}

export interface LessonCompletion {
  lesson_id: string
  completed_at: string
  course_id: string
}

export interface CreateModuleInput {
  course_id: string
  title: string
  description?: string
  sort_order?: number
}

export interface UpdateModuleInput {
  title?: string
  description?: string
  sort_order?: number
}

export interface CreateLessonInput {
  module_id: string
  title: string
  description?: string
  content_type?: LessonContentType
  video_url?: string | null
  content_html?: string
  duration_minutes?: number | null
  sort_order?: number
  is_published?: boolean
}

export interface UpdateLessonInput {
  title?: string
  description?: string
  content_type?: LessonContentType
  video_url?: string | null
  content_html?: string
  duration_minutes?: number | null
  is_published?: boolean
}

export interface CourseEnrollmentMeta {
  enrollment_count: number
  enrollment_open: boolean
  seats_remaining: number | null
}

export interface CourseCurriculum {
  course: CourseRow
  modules: ModuleRow[]
  completions: Set<string>
  enrollmentProgress: number | null
  canAccessContent: boolean
  isEnrolled: boolean
  enrollmentMeta: CourseEnrollmentMeta | null
}
