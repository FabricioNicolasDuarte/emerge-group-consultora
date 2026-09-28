export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface CourseSession {
  id: string
  course_id: string
  module_id: string | null
  title: string
  session_date: string
  start_time: string | null
  end_time: string | null
  notes: string
  meeting_url?: string | null
  meeting_provider?: string | null
}

export interface CourseSessionStats extends CourseSession {
  total_marked: number
  present_count: number
  absent_count: number
}

export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  status: AttendanceStatus
  notes: string
  marked_at: string
}

export interface SessionStudentRow {
  student_id: string
  full_name: string
  email: string | null
  avatar_url: string | null
  record_id: string | null
  status: AttendanceStatus | null
}

export interface Assessment {
  id: string
  course_id: string
  module_id: string | null
  title: string
  description: string
  max_score: number
  weight_percent: number
  due_date: string | null
  is_published: boolean
}

export interface StudentGrade {
  id: string
  assessment_id: string
  student_id: string
  score: number | null
  feedback: string
  graded_at: string
}

export interface GradebookCell {
  grade_id: string | null
  score: number | null
  feedback: string
}

export interface MyAttendanceSummary {
  course_id: string
  course_title: string
  course_slug: string
  total_sessions: number
  attended_sessions: number
  attendance_percent: number
}

export interface MyAttendanceRow {
  id: string
  status: AttendanceStatus
  notes: string
  marked_at: string
  session_id: string
  session_title: string
  session_date: string
  course_id: string
  course_title: string
  course_slug: string
}

export interface MyGradeRow {
  id: string
  score: number | null
  feedback: string
  graded_at: string
  assessment_id: string
  assessment_title: string
  max_score: number
  weight_percent: number
  due_date: string | null
  course_id: string
  course_title: string
  course_slug: string
  score_percent: number | null
}

export interface MyCourseAverage {
  course_id: string
  course_title: string
  course_slug: string
  graded_count: number
  average_percent: number | null
}

export interface CreateSessionInput {
  course_id: string
  title: string
  session_date: string
  start_time?: string | null
  notes?: string
  module_id?: string | null
  meeting_url?: string | null
  meeting_provider?: string | null
}

export interface CreateAssessmentInput {
  course_id: string
  title: string
  description?: string
  max_score?: number
  weight_percent?: number
  due_date?: string | null
  is_published?: boolean
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tarde',
  excused: 'Justificado',
}

export const ATTENDANCE_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']
