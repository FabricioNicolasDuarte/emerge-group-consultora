import type { AdminCourseRow, CourseAssignmentRow, RecentEnrollment, StudentProfile } from '~/types/academic'
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
  const nuxtApp = useNuxtApp()
  if (nuxtApp._adminCampusData) {
    return nuxtApp._adminCampusData as ReturnType<typeof createAdminCampusData>
  }

  const api = createAdminCampusData()
  nuxtApp._adminCampusData = api
  return api
}

function createAdminCampusData() {
  const user = useSupabaseUser()
  const { paymentsEnabled } = useCampusFeatures()
  const { updateCoursePricing } = useCampusCommerce()
  const {
    fetchAdminCourses,
    fetchRecentEnrollments,
    fetchStudents,
    createCourse,
    createEnrollment,
    updateCourseStatus,
    updateCourseCohort,
    fetchTeachers,
    fetchCourseAssignments,
    assignTeacher,
    unassignTeacher,
  } = useAcademic()

  const courses = useState<AdminCourseRow[]>('admin-courses', () => [])
  const recentEnrollments = useState<RecentEnrollment[]>('admin-enrollments', () => [])
  const stats = useState('admin-stats', () => ({
    publishedCourses: 0,
    totalStudents: 0,
    activeEnrollments: 0,
  }))
  const students = useState<StudentProfile[]>('admin-students', () => [])
  const teachers = useState<{ id: string, full_name: string, email: string | null }[]>('admin-teachers', () => [])
  const courseAssignments = useState<CourseAssignmentRow[]>('admin-course-assignments', () => [])
  const loading = useState('admin-campus-loading', () => true)
  const errorMessage = useState('admin-error', () => '')
  const successMessage = useState('admin-success', () => '')

  const showCourseForm = ref(false)
  const showEnrollmentForm = ref(false)
  const showStudentForm = ref(false)
  const showTeacherUserForm = ref(false)
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
  const newStudent = reactive({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    job_role: '',
    occupation: '',
    audience: '',
    challenge: '',
  })
  const newTeacher = reactive({
    full_name: '',
    email: '',
    password: '',
    role: 'docente' as 'docente' | 'tutor',
  })
  const teacherAssignment = reactive({
    mode: 'course' as 'course' | 'teacher',
    course_id: '',
    course_title: '',
    teacher_id: '',
    teacher_name: '',
    role: 'docente' as 'docente' | 'tutor',
  })

  const courseSearch = ref('')
  const studentSearch = ref('')
  const enrollmentSearch = ref('')
  const teacherSearch = ref('')

  const filteredCourses = computed(() => {
    const list = (courses.value ?? []).filter((c) => Boolean(c?.id))
    const q = courseSearch.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((c) =>
      c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
    )
  })

  const filteredStudents = computed(() => {
    const list = (students.value ?? []).filter((s) => Boolean(s?.id && s.full_name))
    const q = studentSearch.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((s) =>
      s.full_name.toLowerCase().includes(q)
      || (s.email ?? '').toLowerCase().includes(q)
      || (s.phone ?? '').includes(q)
      || (s.city ?? '').toLowerCase().includes(q)
      || (s.job_role ?? '').toLowerCase().includes(q)
      || (s.occupation ?? '').toLowerCase().includes(q),
    )
  })

  const filteredEnrollments = computed(() => {
    const list = (recentEnrollments.value ?? []).filter((row) => Boolean(row?.student_id))
    const q = enrollmentSearch.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((row) =>
      row.student_name.toLowerCase().includes(q)
      || row.course_title.toLowerCase().includes(q)
      || (row.student_email ?? '').toLowerCase().includes(q),
    )
  })

  const filteredTeachers = computed(() => {
    const list = [...(teachers.value ?? [])].filter((t) => Boolean(t?.id && t.full_name))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'es'))
    const q = teacherSearch.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((t) =>
      t.full_name.toLowerCase().includes(q)
      || (t.email ?? '').toLowerCase().includes(q),
    )
  })

  const assignmentsByTeacher = computed(() => {
    const map: Record<string, CourseAssignmentRow[]> = {}
    for (const row of courseAssignments.value) {
      const list = map[row.teacher_id] ?? []
      list.push(row)
      map[row.teacher_id] = list
    }
    return map
  })

  const availableCoursesForTeacher = computed(() => {
    if (!teacherAssignment.teacher_id) return courses.value
    const assigned = new Set(
      (assignmentsByTeacher.value[teacherAssignment.teacher_id] ?? []).map((a) => a.course_id),
    )
    return courses.value.filter((c) => !assigned.has(c.id))
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
    const counts: Record<string, number> = {}
    for (const row of recentEnrollments.value) {
      counts[row.student_id] = (counts[row.student_id] ?? 0) + 1
    }
    return counts
  })

  function enrichAssignments(
    rows: CourseAssignmentRow[],
    courseRows: AdminCourseRow[],
    teacherRows: { id: string, full_name: string, email: string | null }[],
  ) {
    const courseTitles = new Map(courseRows.map((c) => [c.id, c.title]))
    const teacherNames = new Map(teacherRows.map((t) => [t.id, t.full_name]))
    return rows.map((row) => ({
      ...row,
      course_title: courseTitles.get(row.course_id) || row.course_title || 'Curso',
      teacher_name: teacherNames.get(row.teacher_id) || row.teacher_name || 'Docente',
    }))
  }

  function statusLabel(status: string) {
    if (status === 'published') return 'Activo'
    if (status === 'archived') return 'Archivado'
    return 'Borrador'
  }

  const loadGeneration = useState('admin-campus-load-gen', () => 0)
  const nuxtApp = useNuxtApp()

  async function loadData(force = false) {
    if (!user.value) return

    const existing = nuxtApp._adminCampusLoad as Promise<void> | undefined
    if (existing && !force) return existing

    const generation = ++loadGeneration.value
    loading.value = true
    errorMessage.value = ''
    const errors: string[] = []

    const request = (async () => {
      try {
        const [courseRows, enrollmentRows, studentRows, teacherRows, assignmentRows] = await Promise.all([
          fetchAdminCourses().catch((e: unknown) => { errors.push(`Cursos: ${formatSupabaseError(e)}`); return [] as AdminCourseRow[] }),
          fetchRecentEnrollments().catch((e: unknown) => { errors.push(`Inscripciones: ${formatSupabaseError(e)}`); return [] as RecentEnrollment[] }),
          fetchStudents().catch((e: unknown) => { errors.push(`Alumnos: ${formatSupabaseError(e)}`); return [] }),
          fetchTeachers().catch((e: unknown) => { errors.push(`Docentes: ${formatSupabaseError(e)}`); return [] }),
          fetchCourseAssignments().catch((e: unknown) => { errors.push(`Asignaciones: ${formatSupabaseError(e)}`); return [] as CourseAssignmentRow[] }),
        ])
        if (generation !== loadGeneration.value) return

        courses.value = courseRows
        recentEnrollments.value = enrollmentRows
        students.value = studentRows
        teachers.value = teacherRows
        courseAssignments.value = enrichAssignments(assignmentRows, courseRows, teacherRows)
        stats.value = {
          publishedCourses: courseRows.filter((c) => c.status === 'published').length,
          totalStudents: studentRows.length,
          activeEnrollments: courseRows.reduce((sum, course) => sum + course.enrollment_count, 0),
        }
        if (errors.length) errorMessage.value = errors.join(' | ')
      } catch (error: unknown) {
        if (generation === loadGeneration.value) {
          errorMessage.value = formatSupabaseError(error, 'Error al cargar datos')
        }
      } finally {
        if (generation === loadGeneration.value) {
          loading.value = false
        }
        if (nuxtApp._adminCampusLoad === request) {
          nuxtApp._adminCampusLoad = undefined
        }
      }
    })()

    nuxtApp._adminCampusLoad = request
    return request
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
      await loadData(true)
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
      await loadData(true)
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la inscripción'
    } finally {
      formLoading.value = false
    }
  }

  async function onCreateStudent() {
    if (!newStudent.full_name.trim() || !newStudent.email.trim() || newStudent.password.length < 8) {
      errorMessage.value = 'Completá nombre, correo y una contraseña de al menos 8 caracteres.'
      return
    }
    formLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    try {
      await $fetch('/api/campus/admin/users', {
        method: 'POST',
        body: {
          fullName: newStudent.full_name.trim(),
          email: newStudent.email.trim(),
          password: newStudent.password,
          phone: newStudent.phone.trim() || null,
          city: newStudent.city.trim() || null,
          jobRole: newStudent.job_role.trim() || null,
          occupation: newStudent.occupation.trim() || null,
          audience: newStudent.audience.trim() || null,
          challenge: newStudent.challenge.trim() || null,
          role: 'alumno',
        },
      })
      showStudentForm.value = false
      Object.assign(newStudent, {
        full_name: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        job_role: '',
        occupation: '',
        audience: '',
        challenge: '',
      })
      successMessage.value = 'Alumno creado. Ya podés inscribirlo a un curso.'
      await loadData(true)
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'data' in error
        ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || '')
        : ''
      errorMessage.value = message || (error instanceof Error ? error.message : 'No se pudo crear el alumno')
    } finally {
      formLoading.value = false
    }
  }

  async function togglePublish(course: AdminCourseRow) {
    const next = course.status === 'published' ? 'draft' : 'published'
    try {
      await updateCourseStatus(course.id, next)
      await loadData(true)
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
      await loadData(true)
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
      await loadData(true)
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'No se pudo actualizar la cohorte')
    } finally {
      formLoading.value = false
    }
  }

  function openTeacherForm(course: AdminCourseRow) {
    teacherAssignment.mode = 'course'
    teacherAssignment.course_id = course.id
    teacherAssignment.course_title = course.title
    teacherAssignment.teacher_id = ''
    teacherAssignment.teacher_name = ''
    teacherAssignment.role = 'docente'
    showTeacherForm.value = true
  }

  function openAssignCourseForm(teacher: { id: string, full_name: string, email: string | null }) {
    teacherAssignment.mode = 'teacher'
    teacherAssignment.teacher_id = teacher.id
    teacherAssignment.teacher_name = teacher.full_name
    teacherAssignment.course_id = ''
    teacherAssignment.course_title = ''
    teacherAssignment.role = 'docente'
    showTeacherForm.value = true
  }

  async function onAssignTeacher() {
    if (!teacherAssignment.course_id || !teacherAssignment.teacher_id) return
    formLoading.value = true
    errorMessage.value = ''
    try {
      await assignTeacher(teacherAssignment.course_id, teacherAssignment.teacher_id, teacherAssignment.role)
      showTeacherForm.value = false
      successMessage.value = 'Asignación guardada.'
      await loadData(true)
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'No se pudo asignar el docente')
    } finally {
      formLoading.value = false
    }
  }

  async function onUnassignTeacher(assignmentId: string) {
    formLoading.value = true
    errorMessage.value = ''
    try {
      await unassignTeacher(assignmentId)
      successMessage.value = 'Asignación quitada.'
      await loadData(true)
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'No se pudo quitar la asignación')
    } finally {
      formLoading.value = false
    }
  }

  async function onCreateTeacher() {
    if (!newTeacher.full_name.trim() || !newTeacher.email.trim() || newTeacher.password.length < 8) {
      errorMessage.value = 'Completá nombre, correo y una contraseña de al menos 8 caracteres.'
      return
    }
    formLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    try {
      await $fetch('/api/campus/admin/users', {
        method: 'POST',
        body: {
          fullName: newTeacher.full_name.trim(),
          email: newTeacher.email.trim(),
          password: newTeacher.password,
          role: newTeacher.role,
        },
      })
      showTeacherUserForm.value = false
      Object.assign(newTeacher, {
        full_name: '',
        email: '',
        password: '',
        role: 'docente',
      })
      successMessage.value = 'Docente creado. Ya podés asignarle cursos.'
      await loadData(true)
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'data' in error
        ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || '')
        : ''
      errorMessage.value = message || (error instanceof Error ? error.message : 'No se pudo crear el docente')
    } finally {
      formLoading.value = false
    }
  }

  // Un solo watcher: el singleton evita apilar watches al navegar entre páginas.
  watch(user, (current) => {
    if (current) void loadData()
  }, { immediate: true })

  return reactive({
    paymentsEnabled,
    courses,
    recentEnrollments,
    stats,
    students,
    teachers,
    courseAssignments,
    loading,
    errorMessage,
    successMessage,
    showCourseForm,
    showEnrollmentForm,
    showStudentForm,
    showTeacherUserForm,
    showPriceForm,
    showCohortForm,
    showTeacherForm,
    formLoading,
    priceEdit,
    cohortEdit,
    newCourse,
    newEnrollment,
    newStudent,
    newTeacher,
    teacherAssignment,
    courseSearch,
    studentSearch,
    enrollmentSearch,
    teacherSearch,
    filteredCourses,
    filteredStudents,
    filteredEnrollments,
    filteredTeachers,
    assignmentsByTeacher,
    availableCoursesForTeacher,
    completedEnrollments,
    avgEnrollmentProgress,
    topCoursesByEnrollment,
    enrollmentChartBars,
    studentEnrollmentCounts,
    statusLabel,
    loadData,
    onCreateCourse,
    onCreateEnrollment,
    onCreateStudent,
    onCreateTeacher,
    togglePublish,
    openPriceForm,
    onUpdatePrice,
    openCohortForm,
    onUpdateCohort,
    openTeacherForm,
    openAssignCourseForm,
    onAssignTeacher,
    onUnassignTeacher,
  })
}
