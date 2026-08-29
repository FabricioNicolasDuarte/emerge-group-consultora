import type {
  CampusReportSummary,
  CoursePerformanceRow,
  EnrollmentReportRow,
} from '~/types/audit'

export function useCampusReports() {
  const supabase = useSupabaseClient()

  async function fetchCampusReportSummary() {
    const { data, error } = await supabase
      .from('campus_report_summary')
      .select('*')
      .maybeSingle()

    if (error) throw error
    return (data ?? {
      published_courses: 0,
      active_enrollments: 0,
      completed_enrollments: 0,
      avg_progress_percent: 0,
      unique_students: 0,
      activity_last_30_days: 0,
      attendance_rate_percent: 0,
      avg_grade: 0,
    }) as CampusReportSummary
  }

  async function fetchCoursePerformance() {
    const { data, error } = await supabase
      .from('course_performance_report')
      .select('*')

    if (error) throw error
    return (data ?? []) as CoursePerformanceRow[]
  }

  async function fetchEnrollmentReport() {
    const { data, error } = await supabase
      .from('enrollment_report')
      .select('*')

    if (error) throw error
    return (data ?? []) as EnrollmentReportRow[]
  }

  function exportEnrollmentsCsv(rows: EnrollmentReportRow[]) {
    const headers = [
      'Alumno',
      'Email',
      'Curso',
      'Categoría',
      'Estado',
      'Progreso %',
      'Inscripto',
      'Completado',
    ]

    const escape = (value: string | number | null | undefined) => {
      const text = value == null ? '' : String(value)
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    }

    const lines = [
      headers.join(','),
      ...rows.map((row) => [
        escape(row.student_name),
        escape(row.student_email),
        escape(row.course_title),
        escape(row.course_category),
        escape(row.status),
        escape(row.progress_percent),
        escape(new Date(row.enrolled_at).toLocaleDateString('es-AR')),
        escape(row.completed_at ? new Date(row.completed_at).toLocaleDateString('es-AR') : ''),
      ].join(',')),
    ]

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inscripciones-campus-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportCoursePerformanceCsv(rows: CoursePerformanceRow[]) {
    const headers = [
      'Curso',
      'Categoría',
      'Estado',
      'Inscriptos activos',
      'Completados',
      'Progreso promedio %',
      'Asistencia %',
      'Nota promedio',
    ]

    const escape = (value: string | number | null | undefined) => {
      const text = value == null ? '' : String(value)
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    }

    const lines = [
      headers.join(','),
      ...rows.map((row) => [
        escape(row.course_title),
        escape(row.category),
        escape(row.status),
        escape(row.active_enrollments),
        escape(row.completed_enrollments),
        escape(row.avg_progress_percent),
        escape(row.attendance_rate_percent),
        escape(row.avg_grade),
      ].join(',')),
    ]

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rendimiento-cursos-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    fetchCampusReportSummary,
    fetchCoursePerformance,
    fetchEnrollmentReport,
    exportEnrollmentsCsv,
    exportCoursePerformanceCsv,
  }
}
