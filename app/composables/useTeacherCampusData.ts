import type { TeachingCourse } from '~/types/academic'
import type { LiveSession } from '~/types/commerce'
import type { CourseSessionStats } from '~/types/tracking'

export function useTeacherCampusData() {
  const { fetchTeachingCourses } = useAcademic()
  const { fetchUpcomingLiveSessions } = useCampusCommerce()
  const { fetchCourseSessions } = useCourseTracking()

  const courses = useState<TeachingCourse[]>('teacher-courses', () => [])
  const liveSessions = useState<LiveSession[]>('teacher-live-sessions', () => [])
  const sessionStats = useState<CourseSessionStats[]>('teacher-session-stats', () => [])
  const loading = useState('teacher-campus-loading', () => true)

  const totalStudents = computed(() =>
    courses.value.reduce((n, c) => n + c.enrollment_count, 0),
  )

  const enrollmentChartBars = computed(() =>
    courses.value.slice(0, 6).map((c) => ({
      label: c.title.length > 20 ? `${c.title.slice(0, 20)}…` : c.title,
      value: c.enrollment_count,
    })),
  )

  const attendanceChartBars = computed(() => {
    const byCourse = new Map<string, { title: string; present: number; total: number }>()
    for (const course of courses.value) {
      byCourse.set(course.course_id, { title: course.title, present: 0, total: 0 })
    }
    for (const session of sessionStats.value) {
      const bucket = byCourse.get(session.course_id)
      if (!bucket) continue
      bucket.present += session.present_count
      bucket.total += session.total_marked
    }
    return [...byCourse.values()]
      .filter((row) => row.total > 0)
      .slice(0, 6)
      .map((row) => ({
        label: row.title.length > 20 ? `${row.title.slice(0, 20)}…` : row.title,
        value: Math.round((row.present / row.total) * 100),
      }))
  })

  async function loadData() {
    try {
      const [courseRows, sessionRows] = await Promise.all([
        fetchTeachingCourses(),
        fetchUpcomingLiveSessions().catch(() => []),
      ])
      courses.value = courseRows
      liveSessions.value = sessionRows
      const stats = await Promise.all(
        courseRows.map((c) => fetchCourseSessions(c.course_id).catch(() => [] as CourseSessionStats[])),
      )
      sessionStats.value = stats.flat()
    } finally {
      loading.value = false
    }
  }

  return {
    courses,
    liveSessions,
    loading,
    totalStudents,
    enrollmentChartBars,
    attendanceChartBars,
    loadData,
  }
}
