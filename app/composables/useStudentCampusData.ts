import type { MyEnrollment } from '~/types/academic'
import type { MyCertificate, LiveSession } from '~/types/commerce'
import type { MyAttendanceRow, MyAttendanceSummary, MyCourseAverage, MyGradeRow } from '~/types/tracking'

export function useStudentCampusData() {
  const { fetchMyEnrollments } = useAcademic()
  const { fetchMyCertificates, fetchUpcomingLiveSessions } = useCampusCommerce()
  const {
    fetchMyAttendanceSummary,
    fetchMyAttendance,
    fetchMyGrades,
    fetchMyCourseAverages,
  } = useCourseTracking()

  const enrollments = useState<MyEnrollment[]>('student-enrollments', () => [])
  const certificates = useState<MyCertificate[]>('student-certificates', () => [])
  const liveSessions = useState<LiveSession[]>('student-live-sessions', () => [])
  const attendanceSummary = useState<MyAttendanceSummary[]>('student-attendance-summary', () => [])
  const recentAttendance = useState<MyAttendanceRow[]>('student-recent-attendance', () => [])
  const grades = useState<MyGradeRow[]>('student-grades', () => [])
  const courseAverages = useState<MyCourseAverage[]>('student-course-averages', () => [])
  const loading = useState('student-campus-loading', () => true)

  const activeCount = computed(() => enrollments.value.filter((e) => e.enrollment_status === 'active').length)
  const avgProgress = computed(() => {
    if (!enrollments.value.length) return 0
    const total = enrollments.value.reduce((sum, e) => sum + e.progress_percent, 0)
    return Math.round(total / enrollments.value.length)
  })
  const avgAttendance = computed(() => {
    if (!attendanceSummary.value.length) return 0
    const total = attendanceSummary.value.reduce((sum, row) => sum + row.attendance_percent, 0)
    return Math.round(total / attendanceSummary.value.length)
  })
  const nextCourse = computed(() => {
    const active = enrollments.value.filter((e) => e.enrollment_status === 'active')
    const incomplete = active.filter((e) => e.progress_percent < 100)
    if (incomplete.length) {
      return [...incomplete].sort((a, b) => b.progress_percent - a.progress_percent)[0] ?? null
    }
    return active[0] ?? enrollments.value[0] ?? null
  })
  const inProgressCourses = computed(() =>
    enrollments.value.filter((e) => e.progress_percent > 0 && e.progress_percent < 100),
  )
  const completedCourses = computed(() =>
    enrollments.value.filter((e) => e.progress_percent >= 100),
  )
  const notStartedCourses = computed(() =>
    enrollments.value.filter((e) => e.progress_percent === 0),
  )
  const progressChartBars = computed(() =>
    enrollments.value.slice(0, 5).map((c) => ({
      label: c.title.length > 22 ? `${c.title.slice(0, 22)}…` : c.title,
      value: c.progress_percent,
    })),
  )
  const attendanceChartBars = computed(() =>
    attendanceSummary.value.slice(0, 5).map((r) => ({
      label: r.course_title.length > 22 ? `${r.course_title.slice(0, 22)}…` : r.course_title,
      value: r.attendance_percent,
    })),
  )

  async function loadData() {
    try {
      const [
        enrollmentRows,
        certificateRows,
        sessionRows,
        summaryRows,
        attendanceRows,
        gradeRows,
        averageRows,
      ] = await Promise.all([
        fetchMyEnrollments(),
        fetchMyCertificates().catch(() => []),
        fetchUpcomingLiveSessions().catch(() => []),
        fetchMyAttendanceSummary(),
        fetchMyAttendance(),
        fetchMyGrades(),
        fetchMyCourseAverages(),
      ])
      enrollments.value = enrollmentRows
      certificates.value = certificateRows
      liveSessions.value = sessionRows
      attendanceSummary.value = summaryRows
      recentAttendance.value = attendanceRows
      grades.value = gradeRows
      courseAverages.value = averageRows
    } finally {
      loading.value = false
    }
  }

  return {
    enrollments,
    certificates,
    liveSessions,
    attendanceSummary,
    recentAttendance,
    grades,
    courseAverages,
    loading,
    activeCount,
    avgProgress,
    avgAttendance,
    nextCourse,
    inProgressCourses,
    completedCourses,
    notStartedCourses,
    progressChartBars,
    attendanceChartBars,
    loadData,
  }
}
