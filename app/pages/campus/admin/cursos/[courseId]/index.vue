<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/cursos/:courseId'],
})

const route = useRoute()
const courseId = computed(() => route.params.courseId as string)
const { panelPath, panelLabel } = useCampusBackLink()
const {
  courseContenidoPath,
  courseAlumnosPath,
  courseAsistenciaPath,
  courseCalificacionesPath,
} = useCampusStaffPaths()

const { fetchCourseById, fetchModules, fetchLessonsForCourse } = useCourseContent()
const { fetchCourseStudents, fetchCourseSessions } = useCourseTracking()

const course = ref<Awaited<ReturnType<typeof fetchCourseById>>>(null)
const loading = ref(true)
const errorMessage = ref('')

const stats = reactive({
  modules: 0,
  lessons: 0,
  publishedLessons: 0,
  students: 0,
  sessions: 0,
})

const areas = computed(() => {
  if (!course.value) return []
  return [
    {
      title: 'Contenido',
      description: 'Módulos, clases, videos y materiales del programa.',
      to: courseContenidoPath(courseId.value),
      meta: `${stats.modules} módulos · ${stats.lessons} clases`,
    },
    {
      title: 'Alumnos',
      description: 'Listado de inscriptos y datos de contacto.',
      to: courseAlumnosPath(courseId.value),
      meta: `${stats.students} activos`,
    },
    {
      title: 'Asistencia',
      description: 'Sesiones en vivo y registro de presencia.',
      to: courseAsistenciaPath(courseId.value),
      meta: `${stats.sessions} sesiones`,
    },
    {
      title: 'Calificaciones',
      description: 'Evaluaciones y planilla de notas.',
      to: courseCalificacionesPath(courseId.value),
      meta: 'Planilla del curso',
    },
  ]
})

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    course.value = await fetchCourseById(courseId.value)
    if (!course.value) {
      errorMessage.value = 'Curso no encontrado.'
      return
    }

    const [modules, lessons, students, sessions] = await Promise.all([
      fetchModules(courseId.value),
      fetchLessonsForCourse(courseId.value),
      fetchCourseStudents(courseId.value),
      fetchCourseSessions(courseId.value),
    ])

    stats.modules = modules.length
    stats.lessons = lessons.length
    stats.publishedLessons = lessons.filter((l) => l.is_published).length
    stats.students = students.length
    stats.sessions = sessions.length
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al cargar el curso'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <NuxtLink :to="panelPath" class="panel-back">← Volver a {{ panelLabel }}</NuxtLink>
    <CampusPageHeader
      eyebrow="GESTIÓN DEL CURSO"
      :title="course?.title || 'Cargando…'"
      :description="course ? 'Elegí un área para gestionar el programa.' : undefined"
    >
      <template #actions>
        <NuxtLink
          v-if="course"
          :to="`/campus/cursos/${course.slug}`"
          class="campus-btn campus-btn--primary"
        >
          Vista alumno →
        </NuxtLink>
      </template>
    </CampusPageHeader>

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="resumen" />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="campus-banner">Cargando resumen…</p>

    <section v-if="!loading && course" class="course-hub-stats">
      <div class="course-hub-stat campus-card">
        <strong>{{ stats.modules }}</strong>
        <span>Módulos</span>
      </div>
      <div class="course-hub-stat campus-card">
        <strong>{{ stats.publishedLessons }}/{{ stats.lessons }}</strong>
        <span>Clases publicadas</span>
      </div>
      <div class="course-hub-stat campus-card">
        <strong>{{ stats.students }}</strong>
        <span>Alumnos</span>
      </div>
      <div class="course-hub-stat campus-card">
        <strong>{{ stats.sessions }}</strong>
        <span>Sesiones</span>
      </div>
    </section>

    <section v-if="!loading && course" class="course-hub-grid">
      <NuxtLink
        v-for="area in areas"
        :key="area.to"
        :to="area.to"
        class="course-hub-card campus-card"
      >
        <h2>{{ area.title }}</h2>
        <p>{{ area.description }}</p>
        <small>{{ area.meta }}</small>
      </NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.course-hub-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.course-hub-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.1rem;
}

.course-hub-stat strong {
  font-size: 1.35rem;
  color: var(--eg-ink);
}

.course-hub-stat span {
  font-size: 0.8rem;
  color: var(--eg-ink-soft);
}

.course-hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
}

.course-hub-card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1.15rem 1.2rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.course-hub-card:hover {
  border-color: var(--eg-ink);
  transform: translateY(-1px);
}

.course-hub-card h2 {
  margin: 0;
  font-size: 1.05rem;
}

.course-hub-card p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--eg-ink-soft);
  flex: 1;
}

.course-hub-card small {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--eg-ink);
}
</style>
