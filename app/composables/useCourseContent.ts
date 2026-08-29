import type {
  CourseCurriculum,
  CourseRow,
  CreateLessonInput,
  CreateModuleInput,
  LessonMaterial,
  LessonRow,
  ModuleRow,
  UpdateLessonInput,
} from '~/types/content'

export function useCourseContent() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { hasAnyStaffRole } = useCampusAuth()

  async function fetchCourseBySlug(slug: string) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id, title, slug, description, category, status, cover_image_url,
        price_amount, price_currency,
        cohort_start_date, cohort_end_date, enrollment_cap,
        enrollment_starts_at, enrollment_ends_at
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data as CourseRow | null
  }

  async function fetchCourseById(courseId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id, title, slug, description, category, status, cover_image_url,
        price_amount, price_currency,
        cohort_start_date, cohort_end_date, enrollment_cap,
        enrollment_starts_at, enrollment_ends_at
      `)
      .eq('id', courseId)
      .maybeSingle()

    if (error) throw error
    return data as CourseRow | null
  }

  async function fetchCourseEnrollmentMeta(courseId: string) {
    const { data, error } = await supabase
      .from('course_catalog')
      .select('enrollment_count, enrollment_open, seats_remaining')
      .eq('id', courseId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      enrollment_count: data.enrollment_count ?? 0,
      enrollment_open: data.enrollment_open ?? true,
      seats_remaining: data.seats_remaining ?? null,
    }
  }

  async function fetchModules(courseId: string) {
    const { data, error } = await supabase
      .from('modules')
      .select('id, course_id, title, description, sort_order')
      .eq('course_id', courseId)
      .order('sort_order')

    if (error) throw error
    return (data ?? []) as ModuleRow[]
  }

  async function fetchLessonsForCourse(courseId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id, module_id, title, description, content_type, video_url,
        content_html, duration_minutes, sort_order, is_published,
        modules!inner(course_id)
      `)
      .eq('modules.course_id', courseId)
      .order('sort_order')

    if (error) throw error
    return (data ?? []).map((row) => {
      const { modules: _modules, ...lesson } = row as LessonRow & { modules: unknown }
      return lesson as LessonRow
    })
  }

  async function fetchMyCompletions() {
    if (!user.value) return new Set<string>()

    const { data, error } = await supabase.from('my_lesson_completions').select('lesson_id')
    if (error) throw error
    return new Set((data ?? []).map((row) => row.lesson_id as string))
  }

  async function fetchEnrollmentProgress(courseId: string) {
    if (!user.value) return null

    const { data, error } = await supabase
      .from('enrollments')
      .select('progress_percent')
      .eq('course_id', courseId)
      .eq('student_id', user.value.id)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error
    return data?.progress_percent ?? null
  }

  async function checkEnrollment(courseId: string) {
    if (!user.value) return false

    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.value.id)
      .in('status', ['active', 'completed'])
      .maybeSingle()

    if (error) throw error
    return Boolean(data)
  }

  async function fetchCurriculum(slug: string): Promise<CourseCurriculum | null> {
    const course = await fetchCourseBySlug(slug)
    if (!course) return null

    const [modules, lessons, completions, enrollmentProgress, enrollmentMeta] = await Promise.all([
      fetchModules(course.id),
      fetchLessonsForCourse(course.id),
      fetchMyCompletions(),
      fetchEnrollmentProgress(course.id),
      fetchCourseEnrollmentMeta(course.id),
    ])

    const lessonsByModule = new Map<string, LessonRow[]>()
    for (const lesson of lessons) {
      const list = lessonsByModule.get(lesson.module_id) ?? []
      list.push(lesson)
      lessonsByModule.set(lesson.module_id, list)
    }

    const modulesWithLessons = modules.map((mod) => ({
      ...mod,
      lessons: (lessonsByModule.get(mod.id) ?? []).sort((a, b) => a.sort_order - b.sort_order),
    }))

    const isStaff = hasAnyStaffRole()
    const isEnrolled = enrollmentProgress !== null || await checkEnrollment(course.id)
    const canAccessContent = isStaff || isEnrolled || course.status === 'published'

    return {
      course,
      modules: modulesWithLessons,
      completions,
      enrollmentProgress,
      canAccessContent: canAccessContent && (isStaff || isEnrolled),
      isEnrolled,
      enrollmentMeta,
    }
  }

  async function fetchLesson(lessonId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id, module_id, title, description, content_type, video_url,
        content_html, duration_minutes, sort_order, is_published,
        modules!inner(id, title, sort_order, course_id, courses!inner(id, title, slug, category, status))
      `)
      .eq('id', lessonId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    const row = data as LessonRow & {
      modules: {
        id: string
        title: string
        sort_order: number
        course_id: string
        courses: CourseRow
      }
    }

    return {
      lesson: {
        id: row.id,
        module_id: row.module_id,
        title: row.title,
        description: row.description,
        content_type: row.content_type,
        video_url: row.video_url,
        content_html: row.content_html,
        duration_minutes: row.duration_minutes,
        sort_order: row.sort_order,
        is_published: row.is_published,
      } as LessonRow,
      module: {
        id: row.modules.id,
        course_id: row.modules.course_id,
        title: row.modules.title,
        description: '',
        sort_order: row.modules.sort_order,
      } as ModuleRow,
      course: row.modules.courses,
    }
  }

  async function fetchLessonMaterials(lessonId: string) {
    const { data, error } = await supabase
      .from('lesson_materials')
      .select('id, lesson_id, title, storage_path, mime_type, sort_order')
      .eq('lesson_id', lessonId)
      .order('sort_order')

    if (error) throw error
    return (data ?? []) as LessonMaterial[]
  }

  async function markLessonComplete(lessonId: string) {
    if (!user.value) throw new Error('Debés iniciar sesión')

    const { error } = await supabase.from('lesson_completions').insert({
      lesson_id: lessonId,
      student_id: user.value.id,
    })

    if (error && error.code !== '23505') throw error
  }

  async function unmarkLessonComplete(lessonId: string) {
    if (!user.value) throw new Error('Debés iniciar sesión')

    const { error } = await supabase
      .from('lesson_completions')
      .delete()
      .eq('lesson_id', lessonId)
      .eq('student_id', user.value.id)

    if (error) throw error
  }

  async function createModule(input: CreateModuleInput) {
    const { data, error } = await supabase
      .from('modules')
      .insert({
        course_id: input.course_id,
        title: input.title.trim(),
        description: input.description?.trim() ?? '',
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single()

    if (error) throw error
    return data as ModuleRow
  }

  async function createLesson(input: CreateLessonInput) {
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        module_id: input.module_id,
        title: input.title.trim(),
        description: input.description?.trim() ?? '',
        content_type: input.content_type ?? 'video',
        video_url: input.video_url ?? null,
        content_html: input.content_html ?? '',
        duration_minutes: input.duration_minutes ?? null,
        sort_order: input.sort_order ?? 0,
        is_published: input.is_published ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return data as LessonRow
  }

  async function updateLesson(lessonId: string, input: UpdateLessonInput) {
    const { data, error } = await supabase
      .from('lessons')
      .update(input)
      .eq('id', lessonId)
      .select()
      .single()

    if (error) throw error
    return data as LessonRow
  }

  async function deleteModule(moduleId: string) {
    const { error } = await supabase.from('modules').delete().eq('id', moduleId)
    if (error) throw error
  }

  async function deleteLesson(lessonId: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
    if (error) throw error
  }

  async function uploadLessonMaterial(
    courseId: string,
    lessonId: string,
    file: File,
    title?: string,
  ) {
    const safeName = file.name.replace(/[^\w.\-() ]/g, '_')
    const path = `${courseId}/${lessonId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(path, file, { upsert: false, contentType: file.type || undefined })

    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('lesson_materials')
      .insert({
        lesson_id: lessonId,
        title: title?.trim() || file.name,
        storage_path: path,
        mime_type: file.type || null,
      })
      .select()
      .single()

    if (error) throw error
    return data as LessonMaterial
  }

  async function getMaterialDownloadUrl(storagePath: string, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from('course-materials')
      .createSignedUrl(storagePath, expiresIn)

    if (error) throw error
    return data.signedUrl
  }

  async function deleteMaterial(material: LessonMaterial) {
    await supabase.storage.from('course-materials').remove([material.storage_path])
    const { error } = await supabase.from('lesson_materials').delete().eq('id', material.id)
    if (error) throw error
  }

  function getAllLessons(modules: ModuleRow[]) {
    return modules
      .flatMap((mod) => (mod.lessons ?? []).map((lesson) => ({ ...lesson, module: mod })))
      .sort((a, b) => {
        const modOrder = (a.module.sort_order ?? 0) - (b.module.sort_order ?? 0)
        if (modOrder !== 0) return modOrder
        return a.sort_order - b.sort_order
      })
  }

  function findNextLesson(modules: ModuleRow[], currentLessonId: string) {
    const all = getAllLessons(modules)
    const idx = all.findIndex((l) => l.id === currentLessonId)
    return idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null
  }

  function findPreviousLesson(modules: ModuleRow[], currentLessonId: string) {
    const all = getAllLessons(modules)
    const idx = all.findIndex((l) => l.id === currentLessonId)
    return idx > 0 ? all[idx - 1] : null
  }

  return {
    fetchCourseBySlug,
    fetchCourseById,
    fetchModules,
    fetchLessonsForCourse,
    fetchCurriculum,
    fetchLesson,
    fetchLessonMaterials,
    markLessonComplete,
    unmarkLessonComplete,
    createModule,
    createLesson,
    updateLesson,
    deleteModule,
    deleteLesson,
    uploadLessonMaterial,
    getMaterialDownloadUrl,
    deleteMaterial,
    getAllLessons,
    findNextLesson,
    findPreviousLesson,
    checkEnrollment,
    fetchEnrollmentProgress,
  }
}
