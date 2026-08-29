import type { AdminCourseRow, RecentEnrollment } from '~/types/academic'
import { formatSupabaseError } from '~/utils/supabase-error'

function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromDatetimeLocalValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function buildCohortPayload(form: {
  cohort_start_date: string
  cohort_end_date: string
  enrollment_cap: number | ''
  enrollment_starts_at: string
  enrollment_ends_at: string
}) {
  return {
    cohort_start_date: form.cohort_start_date.trim() || null,
    cohort_end_date: form.cohort_end_date.trim() || null,
    enrollment_cap: form.enrollment_cap === '' ? null : Number(form.enrollment_cap),
    enrollment_starts_at: fromDatetimeLocalValue(form.enrollment_starts_at),
    enrollment_ends_at: fromDatetimeLocalValue(form.enrollment_ends_at),
  }
}
export function useAdminCampusData() {
  const user = useSupabaseUser()
  const { paymentsEnabled } = useCampusFeatures()
  const { updateCoursePricing } = useCampusCommerce()
  const {
    fetchAdminCourses,
    fetchCampusStats,
    fetchRecentEnrollments,
    fetchStudents,
    createCourse,
    createEnrollment,
    updateCourseStatus,
    updateCourseCohort,
    fetchTeachers,
    assignTeacher,
  } = useAcademic()

  const courses = useState<AdminCourseRow[]>('admin-courses', () => [])
  const recentEnrollments = useState<RecentEnrollment[]>('admin-enrollments', () => [])
  const stats = useState('admin-stats', () => ({
    publishedCourses: 0,
    totalStudents: 0,
    activeEnrollments: 0,
  }))
  const students = useState<{ id: string, full_name: string, email: string | null }[]>('admin-students', () => [])
  const teachers = useState<{ id: string, full_name: string, email: string | null }[]>('admin-teachers', () => [])
  const loading = useState('admin-campus-loading', () => true)
  const errorMessage = useState('admin-error', () => '')
  const successMessage = useState('admin-success', () => '')

  const showCourseForm = ref(false)
  const showEnrollmentForm = ref(false)
  const showPriceForm = ref(false)
  const showCohortForm = ref(false)
  const showTeacherForm = ref(false)
  const formLoading = ref(false)

  const priceEdit = reactive({ course_id: '', title: '', price_amount: 0 })
  const cohortEdit = reactive({
    course_id: '',
    title: '',
    cohort_start_date: '',
    cohort_end_date: '',
    enrollment_cap: '' as number | '',
    enrollment_starts_at: '',
    enrollment_ends_at: '',
  })
  const newCourse = reactive({
    title: '',
    category: 'General',
    description: '',
    status: 'draft' as 'draft' | 'published',
    price_amount: 0,
    cohort_start_date: '',
    cohort_end_date: '',
    enrollment_cap: '' as number | '',
    enrollment_starts_at: '',
    enrollment_ends_at: '',
  })
  const newEnrollment = reactive({ course_id: '', student_id: '' })
  const teacherAssignment = reactive({
    course_id: '',
    course_title: '',
    teacher_id: '',
    role: 'docente' as 'docente' | 'tutor',
  })

  const courseSearch = ref('')
  const studentSearch = ref('')
  const enrollmentSearch = ref('')

  const filteredCourses = computed(() => {
    const q = courseSearch.value.trim().toLowerCase()
    if (!q) return courses.value
    return courses.value.filter((c) =>
      c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
    )
  })

  const filteredStudents = computed(() => {
    const q = studentSearch.value.trim().toLowerCase()
    if (!q) return students.value
    return students.value.filter((s) =>
      s.full_name.toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q),
    )
  })

  const filteredEnrollments = computed(() => {
    const q = enrollmentSearch.value.trim().toLowerCase()
    if (!q) return recentEnrollments.value
    return recentEnrollments.value.filter((row) =>
      row.student_name.toLowerCase().includes(q)
      || row.course_title.toLowerCase().includes(q)
      || (row.student_email ?? '').toLowerCase().includes(q),
    )
  })

  const completedEnrollments = computed(() =>
    recentEnrollments.value.filter((row) => row.progress_percent >= 100),
  )

  const avgEnrollmentProgress = computed(() => {
    if (!recentEnrollments.value.length) return 0
    const total = recentEnrollments.value.reduce((sum, row) => sum + row.progress_percent, 0)
    return Math.round(total / recentEnrollments.value.length)
  })

  const topCoursesByEnrollment = computed(() =>
    [...courses.value].sort((a, b) => b.enrollment_count - a.enrollment_count).slice(0, 5),
  )

  const enrollmentChartBars = computed(() =>
    topCoursesByEnrollment.value.map((c) => ({
      label: c.title.length > 18 ? `${c.title.slice(0, 18)}…` : c.title,
      value: c.enrollment_count,
    })),
  )

  const studentEnrollmentCounts = computed(() => {
    const counts = new Map<string, number>()
    for (const row of recentEnrollments.value) {
      counts.set(row.student_id, (counts.get(row.student_id) ?? 0) + 1)
    }
    return counts
  })

  function statusLabel(status: string) {
    if (status === 'published') return 'Activo'
    if (status === 'archived') return 'Archivado'
    return 'Borrador'
  }

  async function loadData() {
    if (!user.value) return
    loading.value = true
    errorMessage.value = ''
    const errors: string[] = []
    try {
      const [courseRows, statsData, enrollmentRows, studentRows, teacherRows] = await Promise.all([
        fetchAdminCourses().catch((e: unknown) => { errors.push(`Cursos: ${formatSupabaseError(e)}`); return [] as AdminCourseRow[] }),
        fetchCampusStats().catch((e: unknown) => { errors.push(`Estadísticas: ${formatSupabaseError(e)}`); return { publishedCourses: 0, totalStudents: 0, activeEnrollments: 0 } }),
        fetchRecentEnrollments().catch((e: unknown) => { errors.push(`Inscripciones: ${formatSupabaseError(e)}`); return [] as RecentEnrollment[] }),
        fetchStudents().catch((e: unknown) => { errors.push(`Alumnos: ${formatSupabaseError(e)}`); return [] }),
        fetchTeachers().catch((e: unknown) => { errors.push(`Docentes: ${formatSupabaseError(e)}`); return [] }),
      ])
      courses.value = courseRows
      stats.value = statsData
      recentEnrollments.value = enrollmentRows
      students.value = studentRows
      teachers.value = teacherRows
      if (errors.length) errorMessage.value = errors.join(' | ')
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'Error al cargar datos')
    } finally {
      loading.value = false
    }
  }

  async function onCreateCourse() {
    if (!newCourse.title.trim()) return
    formLoading.value = true
    try {
      await createCourse({
        title: newCourse.title,
        category: newCourse.category,
        description: newCourse.description,
        status: newCourse.status,
        price_amount: newCourse.price_amount,
        ...buildCohortPayload(newCourse),
      })
      showCourseForm.value = false
      Object.assign(newCourse, {
        title: '',
        description: '',
        category: 'General',
        status: 'draft',
        price_amount: 0,
        cohort_start_date: '',
        cohort_end_date: '',
        enrollment_cap: '',
        enrollment_starts_at: '',
        enrollment_ends_at: '',
      })
      await loadData()
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear el curso'
    } finally {
      formLoading.value = false
    }
  }

  async function onCreateEnrollment() {
    if (!newEnrollment.course_id || !newEnrollment.student_id) return
    formLoading.value = true
    try {
      await createEnrollment(newEnrollment)
      showEnrollmentForm.value = false
      newEnrollment.course_id = ''
      newEnrollment.student_id = ''
      await loadData()
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la inscripción'
    } finally {
      formLoading.value = false
    }
  }

  async function togglePublish(course: AdminCourseRow) {
    const next = course.status === 'published' ? 'draft' : 'published'
    try {
      await updateCourseStatus(course.id, next)
      await loadData()
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : 'No se pudo actualizar el curso'
    }
  }

  function openPriceForm(course: AdminCourseRow) {
    priceEdit.course_id = course.id
    priceEdit.title = course.title
    priceEdit.price_amount = course.price_amount ?? 0
    showPriceForm.value = true
  }

  async function onUpdatePrice() {
    if (!priceEdit.course_id) return
    formLoading.value = true
    try {
      await updateCoursePricing(priceEdit.course_id, priceEdit.price_amount)
      showPriceForm.value = false
      await loadData()
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'No se pudo actualizar el precio')
    } finally {
      formLoading.value = false
    }
  }

  function openCohortForm(course: AdminCourseRow) {
    cohortEdit.course_id = course.id
    cohortEdit.title = course.title
    cohortEdit.cohort_start_date = course.cohort_start_date ?? ''
    cohortEdit.cohort_end_date = course.cohort_end_date ?? ''
    cohortEdit.enrollment_cap = course.enrollment_cap ?? ''
    cohortEdit.enrollment_starts_at = toDatetimeLocalValue(course.enrollment_starts_at)
    cohortEdit.enrollment_ends_at = toDatetimeLocalValue(course.enrollment_ends_at)
    showCohortForm.value = true
  }

  async function onUpdateCohort() {
    if (!cohortEdit.course_id) return
    formLoading.value = true
    try {
      await updateCourseCohort(cohortEdit.course_id, buildCohortPayload(cohortEdit))
      showCohortForm.value = false
      await loadData()
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'No se pudo actualizar la cohorte')
    } finally {
      formLoading.value = false
    }
  }

  function openTeacherForm(course: AdminCourseRow) {
    teacherAssignment.course_id = course.id
    teacherAssignment.course_title = course.title
    teacherAssignment.teacher_id = ''
    teacherAssignment.role = 'docente'
    showTeacherForm.value = true
  }

  async function onAssignTeacher() {
    if (!teacherAssignment.course_id || !teacherAssignment.teacher_id) return
    formLoading.value = true
    try {
      await assignTeacher(teacherAssignment.course_id, teacherAssignment.teacher_id, teacherAssignment.role)
      showTeacherForm.value = false
      successMessage.value = 'Docente asignado al curso.'
      await loadData()
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'No se pudo asignar el docente')
    } finally {
      formLoading.value = false
    }
  }

  watch(user, (current) => {
    if (current) loadData()
  }, { immediate: true })

  return {
    paymentsEnabled,
    courses,
    recentEnrollments,
    stats,
    students,
    teachers,
    loading,
    errorMessage,
    successMessage,
    showCourseForm,
    showEnrollmentForm,
    showPriceForm,
    showCohortForm,
    showTeacherForm,
    formLoading,
    priceEdit,
    cohortEdit,
    newCourse,
    newEnrollment,
    teacherAssignment,
    courseSearch,
    studentSearch,
    enrollmentSearch,
    filteredCourses,
    filteredStudents,
    filteredEnrollments,
    completedEnrollments,
    avgEnrollmentProgress,
    topCoursesByEnrollment,
    enrollmentChartBars,
    studentEnrollmentCounts,
    statusLabel,
    loadData,
    onCreateCourse,
    onCreateEnrollment,
    togglePublish,
    openPriceForm,
    onUpdatePrice,
    openCohortForm,
    onUpdateCohort,
    openTeacherForm,
    onAssignTeacher,
  }
}
