import type {
  Assessment,
  AttendanceRecord,
  AttendanceStatus,
  CourseSessionStats,
  CourseStudentAttendanceDetail,
  CourseStudentAttendanceSummary,
  CreateAssessmentInput,
  CreateSessionInput,
  GradebookCell,
  MyAttendanceRow,
  MyAttendanceSummary,
  MyCourseAverage,
  MyGradeRow,
  SessionStudentRow,
  StudentGrade,
} from '~/types/tracking'
import { resolveAuthUserId } from '~/utils/auth-user'

export function useCourseTracking() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchCourseSessions(courseId: string) {
    const { data, error } = await supabase
      .from('course_session_stats')
      .select('*')
      .eq('course_id', courseId)

    if (error) throw error
    return (data ?? []) as CourseSessionStats[]
  }

  async function fetchCourseStudents(courseId: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('student_id, profiles:student_id(id, full_name, email, avatar_url)')
      .eq('course_id', courseId)
      .eq('status', 'active')

    if (error) throw error

    return (data ?? []).map((row) => {
      const profile = row.profiles as {
        id: string
        full_name: string
        email: string | null
        avatar_url: string | null
      } | null
      return {
        id: profile?.id ?? row.student_id,
        full_name: profile?.full_name ?? 'Sin nombre',
        email: profile?.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }
    })
  }

  async function fetchSessionAttendance(sessionId: string) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('id, session_id, student_id, status, notes, marked_at')
      .eq('session_id', sessionId)

    if (error) throw error
    return (data ?? []) as AttendanceRecord[]
  }

  async function fetchSessionRoster(sessionId: string, courseId: string): Promise<SessionStudentRow[]> {
    const [students, records] = await Promise.all([
      fetchCourseStudents(courseId),
      fetchSessionAttendance(sessionId),
    ])

    const byStudent = new Map(records.map((r) => [r.student_id, r]))

    return students.map((student) => {
      const record = byStudent.get(student.id)
      return {
        student_id: student.id,
        full_name: student.full_name,
        email: student.email,
        avatar_url: student.avatar_url,
        record_id: record?.id ?? null,
        status: record?.status ?? null,
        notes: record?.notes ?? '',
      }
    })
  }

  async function fetchCourseStudentAttendance(courseId: string) {
    const { data, error } = await supabase
      .from('course_student_attendance')
      .select('*')
      .eq('course_id', courseId)
      .order('full_name')

    if (error) throw error
    return (data ?? []) as CourseStudentAttendanceSummary[]
  }

  async function fetchStudentAttendanceDetail(courseId: string, studentId: string) {
    const { data, error } = await supabase
      .from('course_student_attendance_detail')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .order('session_date', { ascending: false })

    if (error) throw error
    return (data ?? []) as CourseStudentAttendanceDetail[]
  }

  async function fetchCourseAttendanceRecords(courseId: string) {
    const { data, error } = await supabase
      .from('course_student_attendance_detail')
      .select('*')
      .eq('course_id', courseId)
      .order('session_date', { ascending: false })
      .order('marked_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as CourseStudentAttendanceDetail[]
  }

  /** Crea el encuentro del día si no existe (el docente no tiene que gestionarlo a mano). */
  async function findOrCreateSessionForDate(
    courseId: string,
    sessionDate: string,
    title?: string,
  ) {
    const label = title?.trim() || `Clase del ${sessionDate.split('-').reverse().join('/')}`
    const existing = await fetchCourseSessions(courseId)
    const match = existing.find(
      (s) => s.session_date === sessionDate && s.title === label,
    )
    if (match) return match

    const sameDay = existing.find((s) => s.session_date === sessionDate)
    if (sameDay && !title?.trim()) return sameDay

    return createSession({
      course_id: courseId,
      title: label,
      session_date: sessionDate,
      start_time: null,
      meeting_provider: 'other',
    })
  }

  async function createSession(input: CreateSessionInput) {
    const { data, error } = await supabase
      .from('course_sessions')
      .insert({
        course_id: input.course_id,
        title: input.title.trim(),
        session_date: input.session_date,
        start_time: input.start_time || null,
        notes: input.notes?.trim() ?? '',
        module_id: input.module_id ?? null,
        meeting_url: input.meeting_url?.trim() || null,
        meeting_provider: input.meeting_provider ?? 'other',
        created_by: resolveAuthUserId(user.value),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function deleteSession(sessionId: string) {
    const { error } = await supabase.from('course_sessions').delete().eq('id', sessionId)
    if (error) throw error
  }

  /**
   * Docente/staff: solo alta inicial.
   * Superadmin: alta o corrección (update).
   * Justificado exige motivo.
   */
  async function upsertAttendance(
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    notes = '',
    options?: { allowUpdate?: boolean },
  ) {
    const trimmedNotes = notes.trim()
    if (status === 'excused' && !trimmedNotes) {
      throw new Error('La asistencia justificada requiere un motivo.')
    }

    const payload = {
      session_id: sessionId,
      student_id: studentId,
      status,
      notes: status === 'excused' ? trimmedNotes : trimmedNotes,
      marked_by: resolveAuthUserId(user.value),
      marked_at: new Date().toISOString(),
    }

    if (options?.allowUpdate) {
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(payload, { onConflict: 'session_id,student_id' })
        .select()
        .single()
      if (error) throw error
      return data as AttendanceRecord
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .insert(payload)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya hay un registro para este alumno en esa fecha. Corregilo desde el formulario (actualizar).')
      }
      throw error
    }
    return data as AttendanceRecord
  }

  async function deleteAttendance(recordId: string) {
    const { error } = await supabase.from('attendance_records').delete().eq('id', recordId)
    if (error) throw error
  }

  async function markAllPresent(sessionId: string, courseId: string, allowUpdate = false) {
    const roster = await fetchSessionRoster(sessionId, courseId)
    await Promise.all(
      roster
        .filter((row) => allowUpdate || !row.record_id)
        .map((row) =>
          upsertAttendance(sessionId, row.student_id, 'present', '', { allowUpdate }),
        ),
    )
  }

  async function fetchAssessments(courseId: string) {
    const { data, error } = await supabase
      .from('assessments')
      .select('id, course_id, module_id, title, description, max_score, weight_percent, due_date, is_published')
      .eq('course_id', courseId)
      .order('created_at')

    if (error) throw error
    return (data ?? []) as Assessment[]
  }

  async function createAssessment(input: CreateAssessmentInput) {
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        course_id: input.course_id,
        title: input.title.trim(),
        description: input.description?.trim() ?? '',
        max_score: input.max_score ?? 100,
        weight_percent: input.weight_percent ?? 100,
        due_date: input.due_date || null,
        is_published: input.is_published ?? false,
        created_by: resolveAuthUserId(user.value),
      })
      .select()
      .single()

    if (error) throw error
    return data as Assessment
  }

  async function updateAssessment(assessmentId: string, patch: Partial<Assessment>) {
    const { data, error } = await supabase
      .from('assessments')
      .update(patch)
      .eq('id', assessmentId)
      .select()
      .single()

    if (error) throw error
    return data as Assessment
  }

  async function deleteAssessment(assessmentId: string) {
    const { error } = await supabase.from('assessments').delete().eq('id', assessmentId)
    if (error) throw error
  }

  async function fetchGradesForCourse(courseId: string) {
    const { data, error } = await supabase
      .from('student_grades')
      .select(`
        id, assessment_id, student_id, score, feedback, graded_at,
        assessments!inner(id, course_id, title, max_score)
      `)
      .eq('assessments.course_id', courseId)

    if (error) throw error
    return (data ?? []) as StudentGrade[]
  }

  async function buildGradebook(courseId: string) {
    const [students, assessments, grades] = await Promise.all([
      fetchCourseStudents(courseId),
      fetchAssessments(courseId),
      fetchGradesForCourse(courseId),
    ])

    const gradeMap = new Map<string, GradebookCell>()
    for (const grade of grades) {
      gradeMap.set(`${grade.student_id}:${grade.assessment_id}`, {
        grade_id: grade.id,
        score: grade.score,
        feedback: grade.feedback,
      })
    }

    return { students, assessments, gradeMap }
  }

  async function upsertGrade(
    assessmentId: string,
    studentId: string,
    score: number | null,
    feedback = '',
  ) {
    const { data, error } = await supabase
      .from('student_grades')
      .upsert(
        {
          assessment_id: assessmentId,
          student_id: studentId,
          score,
          feedback,
          graded_by: resolveAuthUserId(user.value),
          graded_at: new Date().toISOString(),
        },
        { onConflict: 'assessment_id,student_id' },
      )
      .select()
      .single()

    if (error) throw error
    return data as StudentGrade
  }

  async function fetchMyAttendanceSummary() {
    const { data, error } = await supabase.from('my_attendance_summary').select('*')
    if (error) throw error
    return (data ?? []) as MyAttendanceSummary[]
  }

  async function fetchMyAttendance() {
    const { data, error } = await supabase.from('my_attendance').select('*')
    if (error) throw error
    return (data ?? []) as MyAttendanceRow[]
  }

  async function fetchMyGrades() {
    const { data, error } = await supabase.from('my_grades').select('*')
    if (error) throw error
    return (data ?? []) as MyGradeRow[]
  }

  async function fetchMyCourseAverages() {
    const { data, error } = await supabase.from('my_course_averages').select('*')
    if (error) throw error
    return (data ?? []) as MyCourseAverage[]
  }

  return {
    fetchCourseSessions,
    fetchCourseStudents,
    fetchSessionAttendance,
    fetchSessionRoster,
    fetchCourseStudentAttendance,
    fetchStudentAttendanceDetail,
    fetchCourseAttendanceRecords,
    findOrCreateSessionForDate,
    createSession,
    deleteSession,
    upsertAttendance,
    deleteAttendance,
    markAllPresent,
    fetchAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    fetchGradesForCourse,
    buildGradebook,
    upsertGrade,
    fetchMyAttendanceSummary,
    fetchMyAttendance,
    fetchMyGrades,
    fetchMyCourseAverages,
  }
}
