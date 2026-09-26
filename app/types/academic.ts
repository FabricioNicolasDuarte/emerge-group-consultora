export type CourseStatus = 'draft' | 'published' | 'archived'
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled'
export type AssignmentRole = 'docente' | 'tutor' | 'coordinador'

export interface CourseCohortFields {
  cohort_start_date?: string | null
  cohort_end_date?: string | null
  enrollment_cap?: number | null
  enrollment_starts_at?: string | null
  enrollment_ends_at?: string | null
  enrollment_count?: number
  seats_remaining?: number | null
  enrollment_open?: boolean
}

export interface CourseCatalogItem extends CourseCohortFields {
  id: string
  title: string
  slug: string
  description: string
  category: string
  cover_image_url: string | null
  module_count: number
  price_amount?: number
  price_currency?: string
  is_paid?: boolean
  created_at?: string
}

export interface AdminCourseRow extends CourseCohortFields {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: CourseStatus
  module_count: number
  enrollment_count: number
  price_amount?: number
  price_currency?: string
  created_at: string
}

export interface MyEnrollment {
  enrollment_id: string
  progress_percent: number
  enrollment_status: EnrollmentStatus
  enrolled_at: string
  course_id: string
  title: string
  slug: string
  description: string
  category: string
  cover_image_url: string | null
}

export interface TeachingCourse {
  assignment_id: string
  assignment_role: AssignmentRole
  assigned_at: string
  course_id: string
  title: string
  slug: string
  description: string
  category: string
  status: CourseStatus
  enrollment_count: number
}

export interface CourseAssignmentRow {
  id: string
  course_id: string
  teacher_id: string
  role: AssignmentRole
  assigned_at: string
  course_title: string
  teacher_name: string
}

export interface RecentEnrollment {
  id: string
  progress_percent: number
  enrolled_at: string
  student_id: string
  student_name: string
  student_email: string | null
  course_id: string
  course_title: string
}

export interface CreateCourseInput extends CourseCohortInput {
  title: string
  slug?: string
  description?: string
  category?: string
  status?: CourseStatus
  price_amount?: number
  price_currency?: string
}

export interface CourseCohortInput {
  cohort_start_date?: string | null
  cohort_end_date?: string | null
  enrollment_cap?: number | null
  enrollment_starts_at?: string | null
  enrollment_ends_at?: string | null
}

export interface UpdateCourseCohortInput extends CourseCohortInput {
  course_id: string
}

export interface CreateEnrollmentInput {
  course_id: string
  student_id: string
  progress_percent?: number
}

export interface CampusStats {
  publishedCourses: number
  totalStudents: number
  activeEnrollments: number
}

export interface StudentProfile {
  id: string
  full_name: string
  email: string | null
  phone?: string | null
  city?: string | null
  job_role?: string | null
  occupation?: string | null
  audience?: string | null
  challenge?: string | null
}
