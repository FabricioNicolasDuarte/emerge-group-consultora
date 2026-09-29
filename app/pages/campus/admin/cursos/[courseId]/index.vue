<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { AdminCourseRow } from '~/types/academic'

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
const admin = useAdminCampusData()
const { hasRole, profile, fetchProfile } = useCampusAuth()
const canManageCourseMeta = computed(() => hasRole('superadmin', 'admin', 'coordinador'))

const { fetchCourseById, fetchModules, fetchLessonsForCourse } = useCourseContent()
const { fetchCourseStudents, fetchCourseSessions } = useCourseTracking()

const course = ref<Awaited<ReturnType<typeof fetchCourseById>>>(null)
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')

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

onMounted(async () => {
  await fetchProfile()
  await loadData()
})

function onEditThisCourse() {
  if (!course.value || !canManageCourseMeta.value) return
  const row: AdminCourseRow = {
    id: course.value.id,
    title: course.value.title,
    slug: course.value.slug,
    description: course.value.description || '',
    category: course.value.category || 'General',
    status: course.value.status,
    module_count: stats.modules,
    enrollment_count: stats.students,
    price_amount: course.value.price_amount ?? 0,
    price_currency: course.value.price_currency ?? 'ARS',
    cohort_start_date: course.value.cohort_start_date ?? null,
    cohort_end_date: course.value.cohort_end_date ?? null,
    enrollment_cap: course.value.enrollment_cap ?? null,
    enrollment_starts_at: course.value.enrollment_starts_at ?? null,
    enrollment_ends_at: course.value.enrollment_ends_at ?? null,
    created_at: '',
  }
  admin.openEditCourse(row)
}

async function onDeleteThisCourse() {
  if (!course.value || !canManageCourseMeta.value) return
  await admin.onDeleteCourse({
    id: course.value.id,
    title: course.value.title,
    slug: course.value.slug,
    description: course.value.description || '',
    category: course.value.category || 'General',
    status: course.value.status,
    module_count: stats.modules,
    enrollment_count: stats.students,
    created_at: '',
  })
  if (!admin.errorMessage) {
    await navigateTo(panelPath.value)
  }
}
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
        <CampusAdminCampusTableIconBtn
          v-if="course && canManageCourseMeta"
          icon="mdi:pencil-outline"
          label="Editar título"
          with-label
          @click="onEditThisCourse"
        />
        <CampusAdminCampusTableIconBtn
          v-if="course && canManageCourseMeta"
          icon="mdi:trash-can-outline"
          label="Eliminar curso"
          with-label
          danger
          @click="onDeleteThisCourse"
        />
      </template>
    </CampusPageHeader>

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="resumen" />

    <p v-if="errorMessage || admin.errorMessage" class="campus-banner campus-banner--error">
      {{ errorMessage || admin.errorMessage }}
    </p>
    <p v-if="successMessage || admin.successMessage" class="campus-banner campus-banner--success">
      {{ successMessage || admin.successMessage }}
    </p>
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

    <CampusAdminCampusModals />
  </div>
</template>
