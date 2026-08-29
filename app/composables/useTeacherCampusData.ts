import type { TeachingCourse } from '~/types/academic'
import type { LiveSession } from '~/types/commerce'

export function useTeacherCampusData() {
  const { fetchTeachingCourses } = useAcademic()
  const { fetchUpcomingLiveSessions } = useCampusCommerce()

  const courses = useState<TeachingCourse[]>('teacher-courses', () => [])
  const liveSessions = useState<LiveSession[]>('teacher-live-sessions', () => [])
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

  async function loadData() {
    try {
      const [courseRows, sessionRows] = await Promise.all([
        fetchTeachingCourses(),
        fetchUpcomingLiveSessions().catch(() => []),
      ])
      courses.value = courseRows
      liveSessions.value = sessionRows
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
    loadData,
  }
}
