<script setup lang="ts">
import type { HomePulseItem, HomeToolkitItem, HomeQueueItem } from '~/types/campus-home'

definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['docente', 'tutor', 'coordinador'],
  campusNav: {
    panel: 'teacher',
    group: 'Panel',
    label: 'Inicio',
    icon: 'inicio',
    exact: true,
    order: 1,
  },
})

const { displayName } = useCampusAuth()
const { fetchUnreadCount } = useCampusMailbox()
const { courses, liveSessions, loading, totalStudents, enrollmentChartBars, attendanceChartBars } = useTeacherCampusData()
const { courseHubPath, comunicacionesPath, anunciosPath } = useCampusStaffPaths()

const unreadCount = ref(0)

const firstName = computed(() => {
  const raw = (displayName.value || '').trim()
  if (!raw) return 'docente'
  return raw.split(/\s+/)[0] || raw
})

const nextLive = computed(() => liveSessions.value[0] ?? null)

const focusCourse = computed(() => {
  if (!courses.value.length) return null
  const byEnrollment = [...courses.value].sort((a, b) => b.enrollment_count - a.enrollment_count)
  if (nextLive.value?.course_id) {
    const match = courses.value.find((c) => c.course_id === nextLive.value!.course_id)
    if (match) return match
  }
  return byEnrollment[0] ?? null
})

const emptyCourses = computed(() =>
  courses.value.filter((c) => c.enrollment_count === 0),
)

function formatSessionWhen(date: string, time: string | null) {
  const d = new Date(date)
  const day = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
  return time ? `${day} · ${time.slice(0, 5)}` : day
}

const pulseItems = computed<HomePulseItem[]>(() => {
  const items: HomePulseItem[] = []

  if (unreadCount.value > 0) {
    items.push({
      id: 'unread',
      label: `${unreadCount.value} sin leer`,
      to: '/campus/buzon',
      icon: 'mdi:email-outline',
      tone: 'alert',
    })
  }

  if (nextLive.value) {
    items.push({
      id: 'live',
      label: `En vivo · ${formatSessionWhen(nextLive.value.session_date, nextLive.value.start_time)}`,
      to: nextLive.value.meeting_url || courseHubPath(nextLive.value.course_id),
      icon: 'mdi:video-outline',
      tone: 'default',
      external: Boolean(nextLive.value.meeting_url),
    })
  }

  if (courses.value.length > 0) {
    items.push({
      id: 'roster',
      label: `${courses.value.length} curso${courses.value.length === 1 ? '' : 's'} · ${totalStudents.value} alumno${totalStudents.value === 1 ? '' : 's'}`,
      to: '/campus/teacher/cursos',
      icon: 'mdi:account-group-outline',
      tone: 'muted',
    })
  }

  return items.slice(0, 3)
})

const toolkit = computed<HomeToolkitItem[]>(() => [
  {
    id: 'cursos',
    label: 'Mis cursos',
    hint: courses.value.length
      ? `${courses.value.length} programa${courses.value.length === 1 ? '' : 's'}`
      : 'Sin asignaciones aún',
    to: '/campus/teacher/cursos',
    icon: 'mdi:bookshelf',
  },
  {
    id: 'comms',
    label: 'Comunicaciones',
    hint: 'Avisos y alertas a alumnos',
    to: comunicacionesPath.value,
    icon: 'mdi:bullhorn-outline',
  },
  {
    id: 'buzon',
    label: 'Buzón',
    hint: unreadCount.value > 0 ? 'Hay mensajes nuevos' : 'Mensajes internos',
    to: '/campus/buzon',
    icon: 'mdi:email-outline',
    badge: unreadCount.value > 0 ? unreadCount.value : undefined,
  },
  {
    id: 'anuncios',
    label: 'Anuncios',
    hint: 'Publicá novedades del curso',
    to: anunciosPath.value,
    icon: 'mdi:newspaper-variant-outline',
  },
])

const queueItems = computed<HomeQueueItem[]>(() => {
  const items: HomeQueueItem[] = []

  if (unreadCount.value > 0) {
    items.push({
      id: 'q-unread',
      title: 'Revisar mensajes del buzón',
      subtitle: `${unreadCount.value} sin leer`,
      to: '/campus/buzon',
      tone: 'info',
    })
  }

  if (nextLive.value) {
    items.push({
      id: 'q-live',
      title: nextLive.value.title || 'Próxima clase en vivo',
      subtitle: `${nextLive.value.course_title} · ${formatSessionWhen(nextLive.value.session_date, nextLive.value.start_time)}`,
      to: courseHubPath(nextLive.value.course_id),
      tone: 'default',
    })
  }

  for (const course of emptyCourses.value.slice(0, 2)) {
    items.push({
      id: `q-empty-${course.course_id}`,
      title: `Sin alumnos: ${course.title}`,
      subtitle: 'Pedí a administración la inscripción o revisá el programa',
      to: courseHubPath(course.course_id),
      tone: 'muted',
    })
  }

  for (const course of [...courses.value]
    .filter((c) => c.enrollment_count > 0)
    .sort((a, b) => b.enrollment_count - a.enrollment_count)
    .slice(0, 2)) {
    if (items.some((i) => i.id === `q-empty-${course.course_id}`)) continue
    items.push({
      id: `q-course-${course.course_id}`,
      title: course.title,
      subtitle: `${course.enrollment_count} alumno${course.enrollment_count === 1 ? '' : 's'} · abrir hub`,
      to: courseHubPath(course.course_id),
      tone: 'default',
    })
  }

  return items.slice(0, 5)
})

const showEnrollmentChart = computed(() => enrollmentChartBars.value.some((b) => b.value > 0))
const showAttendanceChart = computed(() => attendanceChartBars.value.some((b) => b.value > 0))

onMounted(async () => {
  try {
    unreadCount.value = await fetchUnreadCount()
  } catch {
    unreadCount.value = 0
  }
})
</script>

<template>
  <div class="campus-home campus-home-stage">
    <CampusRoleSwitcher />

    <template v-if="!loading">
      <CampusHomePulse class="home-anim" :items="pulseItems" />

      <CampusHomeHero
        v-if="focusCourse"
        class="home-anim home-anim--2"
        eyebrow="Tu espacio de enseñanza"
        title="Hola,"
        :highlight="firstName"
        :course-title="focusCourse.title"
        :copy="nextLive
          ? 'Tenés una clase próxima. Entrá al hub del curso o abrí la sala cuando corresponda.'
          : focusCourse.enrollment_count > 0
            ? 'Gestioná contenido, asistencia y notas desde el hub del programa.'
            : 'El programa está asignado. Cuando haya inscriptos, vas a operar todo desde acá.'"
        :meta="[
          focusCourse.category,
          `${focusCourse.enrollment_count} alumno${focusCourse.enrollment_count === 1 ? '' : 's'}`,
          focusCourse.assignment_role === 'tutor' ? 'Tutor' : 'Docente',
        ].filter(Boolean)"
        :cta-label="nextLive ? 'Ir al curso de la clase' : 'Abrir curso'"
        :cta-to="courseHubPath(focusCourse.course_id)"
        secondary-label="Ver mis cursos"
        secondary-to="/campus/teacher/cursos"
      />

      <CampusHomeHero
        v-else
        class="home-anim home-anim--2"
        eyebrow="Tu espacio de enseñanza"
        title="Hola,"
        :highlight="firstName"
        copy="Cuando administración te asigne un programa, vas a gestionar contenido, alumnos y clases desde acá."
        cta-label="Ver mis cursos"
        cta-to="/campus/teacher/cursos"
        secondary-label="Ir al buzón"
        secondary-to="/campus/buzon"
      />

      <section
        v-if="showEnrollmentChart || showAttendanceChart || courses.length > 0"
        class="home-rhythm home-anim home-anim--3"
        :class="{ 'home-rhythm--single': !showEnrollmentChart && !showAttendanceChart }"
        aria-label="Tu carga docente"
      >
        <div v-if="courses.length" class="home-rhythm__ring-wrap home-rhythm__stat">
          <strong class="home-rhythm__stat-value">{{ totalStudents }}</strong>
          <span class="home-rhythm__ring-label">Alumnos a cargo</span>
          <span class="home-rhythm__stat-note">
            {{ courses.length }} curso{{ courses.length === 1 ? '' : 's' }} asignado{{ courses.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div v-if="showEnrollmentChart" class="home-rhythm__panel">
          <h3>Inscriptos por curso</h3>
          <CampusMiniBarChart :bars="enrollmentChartBars" />
          <NuxtLink to="/campus/teacher/cursos" class="home-rhythm__link">Ver mis cursos →</NuxtLink>
        </div>

        <div v-else-if="courses.length" class="home-rhythm__panel">
          <h3>Inscriptos por curso</h3>
          <p class="home-rhythm__empty">Todavía no hay alumnos inscriptos en tus programas.</p>
          <NuxtLink to="/campus/teacher/cursos" class="home-rhythm__link">Ver mis cursos →</NuxtLink>
        </div>

        <div v-if="showAttendanceChart" class="home-rhythm__panel">
          <h3>Asistencia por curso (%)</h3>
          <CampusMiniBarChart :bars="attendanceChartBars" :max="100" />
          <NuxtLink to="/campus/teacher/cursos" class="home-rhythm__link">Cargar asistencia →</NuxtLink>
        </div>
      </section>

      <CampusHomeToolkit class="home-anim home-anim--4" :tools="toolkit" />

      <CampusHomeQueue
        class="home-anim home-anim--5"
        title="Requiere tu atención"
        :items="queueItems"
        empty-text="Estás al día. Cuando haya clases, mensajes o cursos para gestionar, aparecen acá."
      />
    </template>
  </div>
</template>
