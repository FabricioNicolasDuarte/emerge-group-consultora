<script setup lang="ts">
import { Icon } from '@iconify/vue'

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

useTrackFenixLoader(loading)

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
      description: 'Módulos, clases, videos y materiales.',
      to: courseContenidoPath(courseId.value),
      meta: `${stats.modules} módulos · ${stats.lessons} clases`,
      icon: 'mdi:play-box-multiple-outline',
    },
    {
      title: 'Alumnos',
      description: 'Inscriptos activos y contacto.',
      to: courseAlumnosPath(courseId.value),
      meta: `${stats.students} activos`,
      icon: 'mdi:account-group-outline',
    },
    {
      title: 'Asistencia',
      description: 'Nuevo registro por alumno (asistió / no asistió / justificado).',
      to: courseAsistenciaPath(courseId.value),
      meta: stats.sessions
        ? `${stats.sessions} encuentro${stats.sessions === 1 ? '' : 's'} registrados`
        : 'Sin registros · Cargar el primero',
      icon: 'mdi:calendar-check-outline',
    },
    {
      title: 'Calificaciones',
      description: 'Evaluaciones y planilla de notas.',
      to: courseCalificacionesPath(courseId.value),
      meta: 'Planilla del curso',
      icon: 'mdi:clipboard-text-outline',
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
  <div class="campus-mgmt-ambient">
    <NuxtLink :to="panelPath" class="panel-back">← Volver a {{ panelLabel }}</NuxtLink>
    <CampusPageHeader
      eyebrow="GESTIÓN DEL CURSO"
      :title="course?.title || 'Cargando…'"
      :description="course ? 'Elegí un área para operar el programa.' : undefined"
    >
      <template #actions>
        <CampusAdminCampusTableIconBtn
          v-if="course"
          icon="mdi:eye-outline"
          label="Vista alumno"
          :to="`/campus/cursos/${course.slug}`"
        />
      </template>
    </CampusPageHeader>

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="resumen" />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando resumen…</p>

    <template v-if="!loading && course">
      <section class="mgmt-hub-stats">
        <div class="mgmt-hub-stat campus-glass">
          <strong>{{ stats.modules }}</strong>
          <span>Módulos</span>
        </div>
        <div class="mgmt-hub-stat campus-glass">
          <strong>{{ stats.publishedLessons }}/{{ stats.lessons }}</strong>
          <span>Publicadas</span>
        </div>
        <div class="mgmt-hub-stat campus-glass">
          <strong>{{ stats.students }}</strong>
          <span>Alumnos</span>
        </div>
        <div class="mgmt-hub-stat campus-glass">
          <strong>{{ stats.sessions }}</strong>
          <span>Sesiones</span>
        </div>
      </section>

      <section class="mgmt-hub-grid">
        <NuxtLink
          v-for="area in areas"
          :key="area.to"
          :to="area.to"
          class="mgmt-hub-card campus-glass"
        >
          <div class="mgmt-hub-card__icon">
            <Icon :icon="area.icon" width="22" height="22" aria-hidden="true" />
          </div>
          <h2>{{ area.title }}</h2>
          <p>{{ area.description }}</p>
          <small>{{ area.meta }}</small>
        </NuxtLink>
      </section>
    </template>
  </div>
</template>
