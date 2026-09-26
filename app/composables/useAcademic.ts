import type {
  AdminCourseRow,
  AssignmentRole,
  CampusStats,
  CourseAssignmentRow,
  CourseCatalogItem,
  CreateCourseInput,
  CreateEnrollmentInput,
  CourseCohortInput,
  MyEnrollment,
  RecentEnrollment,
  StudentProfile,
  TeachingCourse,
} from '~/types/academic'
import { slugify } from '~/utils/slugify'

export function useAcademic() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function fetchPublishedCourses() {
    const { data, error } = await supabase.from('course_catalog').select('*')
    if (error) throw error
    return (data ?? []) as CourseCatalogItem[]
  }

  async function fetchAdminCourses() {
    const { data, error } = await supabase.from('admin_course_stats').select('*')
    if (error) throw error
    return (data ?? []) as AdminCourseRow[]
  }

  async function fetchMyEnrollments() {
    const { data, error } = await supabase.from('my_enrollments').select('*')
    if (error) throw error
    return (data ?? []) as MyEnrollment[]
  }

  async function fetchTeachingCourses() {
    const { data, error } = await supabase.from('my_teaching_courses').select('*')
    if (error) throw error
    return (data ?? []) as TeachingCourse[]
  }

  async function fetchRecentEnrollments() {
    const { data, error } = await supabase.from('recent_enrollments').select('*')
    if (error) throw error
    return (data ?? []) as RecentEnrollment[]
  }

  async function fetchStudents() {
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('slug', 'alumno')
      .maybeSingle()

    if (roleError) throw roleError
    if (!roleData) return []

    const { data: userRoles, error: urError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', roleData.id)

    if (urError) throw urError

    const ids = (userRoles ?? []).map((row) => row.user_id)
    if (!ids.length) return []

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, city, job_role, occupation, audience, challenge')
      .in('id', ids)
      .order('full_name')

    if (error) throw error
    return (profiles ?? []) as StudentProfile[]
  }

  async function fetchTeachers() {
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, slug')
      .in('slug', ['docente', 'tutor'])

    if (rolesError) throw rolesError
    if (!roles?.length) return []

    const roleIds = roles.map((r) => r.id)
    const { data: userRoles, error: urError } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role_id', roleIds)

    if (urError) throw urError

    const ids = [...new Set((userRoles ?? []).map((row) => row.user_id))]
    if (!ids.length) return []

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ids)

    if (error) throw error
    return (profiles ?? []) as StudentProfile[]
  }

  async function assignTeacher(courseId: string, teacherId: string, role: 'docente' | 'tutor' = 'docente') {
    const { data, error } = await supabase
      .from('course_assignments')
      .insert({
        course_id: courseId,
        teacher_id: teacherId,
        role,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function unassignTeacher(assignmentId: string) {
    const { error } = await supabase
      .from('course_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error
  }

  async function fetchCourseAssignments() {
    const { data, error } = await supabase
      .from('course_assignments')
      .select('id, course_id, teacher_id, role, assigned_at')
      .order('assigned_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id as string,
      course_id: row.course_id as string,
      teacher_id: row.teacher_id as string,
      role: row.role as AssignmentRole,
      assigned_at: row.assigned_at as string,
      course_title: '',
      teacher_name: '',
    })) as CourseAssignmentRow[]
  }

  async function fetchCampusStats(): Promise<CampusStats> {
    const [courses, students] = await Promise.all([
      fetchAdminCourses(),
      fetchStudents(),
    ])

    return {
      publishedCourses: courses.filter((c) => c.status === 'published').length,
      totalStudents: students.length,
      activeEnrollments: courses.reduce((sum, course) => sum + course.enrollment_count, 0),
    }
  }

  async function createCourse(input: CreateCourseInput) {
    const slug = input.slug?.trim() || slugify(input.title)

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: input.title.trim(),
        slug,
        description: input.description?.trim() ?? '',
        category: input.category?.trim() || 'General',
        status: input.status ?? 'draft',
        price_amount: input.price_amount ?? 0,
        price_currency: input.price_currency ?? 'ARS',
        cohort_start_date: input.cohort_start_date || null,
        cohort_end_date: input.cohort_end_date || null,
        enrollment_cap: input.enrollment_cap ?? null,
        enrollment_starts_at: input.enrollment_starts_at || null,
        enrollment_ends_at: input.enrollment_ends_at || null,
        created_by: user.value?.id ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function updateCourseCohort(courseId: string, input: CourseCohortInput) {
    const { data, error } = await supabase
      .from('courses')
      .update({
        cohort_start_date: input.cohort_start_date || null,
        cohort_end_date: input.cohort_end_date || null,
        enrollment_cap: input.enrollment_cap ?? null,
        enrollment_starts_at: input.enrollment_starts_at || null,
        enrollment_ends_at: input.enrollment_ends_at || null,
      })
      .eq('id', courseId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function createEnrollment(input: CreateEnrollmentInput) {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        course_id: input.course_id,
        student_id: input.student_id,
        progress_percent: input.progress_percent ?? 0,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function updateCourseStatus(courseId: string, status: 'draft' | 'published' | 'archived') {
    const { data, error } = await supabase
      .from('courses')
      .update({ status })
      .eq('id', courseId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  return {
    fetchPublishedCourses,
    fetchAdminCourses,
    fetchMyEnrollments,
    fetchTeachingCourses,
    fetchRecentEnrollments,
    fetchStudents,
    fetchTeachers,
    fetchCourseAssignments,
    fetchCampusStats,
    createCourse,
    updateCourseCohort,
    createEnrollment,
    updateCourseStatus,
    assignTeacher,
    unassignTeacher,
  }
}
