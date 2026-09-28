<script setup lang="ts">
import type { HomePulseItem, HomeToolkitItem, HomeQueueItem } from '~/types/campus-home'

definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['alumno'],
  campusNav: {
    panel: 'student',
    group: 'Panel',
    label: 'Inicio',
    icon: 'inicio',
    exact: true,
    order: 1,
  },
})

const { displayName } = useCampusAuth()
const { fetchUnreadCount } = useCampusMailbox()
const {
  loading,
  activeCount,
  avgProgress,
  avgAttendance,
  nextCourse,
  liveSessions,
  enrollments,
  grades,
  certificates,
  notStartedCourses,
  attendanceSummary,
  progressChartBars,
  attendanceChartBars,
} = useStudentCampusData()

const unreadCount = ref(0)

const firstName = computed(() => {
  const raw = (displayName.value || '').trim()
  if (!raw) return 'bienvenido/a'
  return raw.split(/\s+/)[0] || raw
})

const nextLive = computed(() => liveSessions.value[0] ?? null)

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
      label: `${unreadCount.value} mensaje${unreadCount.value === 1 ? '' : 's'} sin leer`,
      to: '/campus/buzon',
      icon: 'mdi:email-outline',
      tone: 'alert',
    })
  }

  if (nextLive.value) {
    const liveTo = nextLive.value.meeting_url || '/campus/student/cursos'
    items.push({
      id: 'live',
      label: `Clase: ${formatSessionWhen(nextLive.value.session_date, nextLive.value.start_time)}`,
      to: liveTo,
      icon: 'mdi:video-outline',
      tone: 'default',
      external: Boolean(nextLive.value.meeting_url),
    })
  }

  if (activeCount.value > 0) {
    items.push({
      id: 'active',
      label: `${activeCount.value} curso${activeCount.value === 1 ? '' : 's'} activo${activeCount.value === 1 ? '' : 's'}`,
      to: '/campus/student/cursos',
      icon: 'mdi:book-open-variant-outline',
      tone: 'muted',
    })
  }

  return items.slice(0, 3)
})

const toolkit = computed<HomeToolkitItem[]>(() => [
  {
    id: 'cursos',
    label: 'Mis cursos',
    hint: `${enrollments.value.length} programa${enrollments.value.length === 1 ? '' : 's'}`,
    to: '/campus/student/cursos',
    icon: 'mdi:bookshelf',
  },
  {
    id: 'notas',
    label: 'Mis notas',
    hint: grades.value.length
      ? `${grades.value.length} evaluación${grades.value.length === 1 ? '' : 'es'}`
      : 'Sin notas aún',
    to: '/campus/student/notas',
    icon: 'mdi:clipboard-text-outline',
  },
  {
    id: 'buzon',
    label: 'Buzón',
    hint: unreadCount.value > 0 ? 'Hay mensajes nuevos' : 'Mensajes y avisos',
    to: '/campus/buzon',
    icon: 'mdi:email-outline',
    badge: unreadCount.value > 0 ? unreadCount.value : undefined,
  },
  {
    id: 'certs',
    label: 'Certificados',
    hint: certificates.value.length
      ? `${certificates.value.length} emitido${certificates.value.length === 1 ? '' : 's'}`
      : 'Cuando completes un curso',
    to: '/campus/student/certificados',
    icon: 'mdi:certificate-outline',
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
      to: nextCourse.value?.slug
        ? `/campus/cursos/${nextCourse.value.slug}`
        : '/campus/student/cursos',
      tone: 'default',
    })
  }

  for (const course of notStartedCourses.value.slice(0, 2)) {
    items.push({
      id: `q-start-${course.enrollment_id}`,
      title: `Empezar: ${course.title}`,
      subtitle: 'Todavía no registraste avance',
      to: `/campus/cursos/${course.slug}`,
      tone: 'muted',
    })
  }

  const lowAttendance = attendanceSummary.value
    .filter((r) => r.attendance_percent > 0 && r.attendance_percent < 70)
    .slice(0, 1)

  for (const row of lowAttendance) {
    items.push({
      id: `q-att-${row.course_id}`,
      title: 'Asistencia baja',
      subtitle: `${row.course_title} · ${row.attendance_percent}%`,
      to: '/campus/student/asistencia',
      tone: 'default',
    })
  }

  return items.slice(0, 5)
})

const showProgressChart = computed(() => progressChartBars.value.length > 0)
const showAttendanceChart = computed(() => attendanceChartBars.value.length > 0)
const showRhythm = computed(() => showProgressChart.value || showAttendanceChart.value || avgProgress.value > 0)

onMounted(async () => {
  try {
    unreadCount.value = await fetchUnreadCount()
  } catch {
    unreadCount.value = 0
  }
})
</script>

<template>
  <div class="campus-home campus-mgmt-ambient">
    <CampusRoleSwitcher />

    <p v-if="loading" class="campus-home__loading">Preparando tu campus…</p>

    <template v-else>
      <CampusHomePulse :items="pulseItems" />

      <CampusHomeHero
        v-if="nextCourse"
        eyebrow="Mi campus"
        title="Hola,"
        :highlight="firstName"
        :copy="`Seguí con ${nextCourse.title}.`"
        :meta="[
          `${nextCourse.progress_percent}% completado`,
          nextCourse.category,
          avgAttendance > 0 ? `Asistencia ${avgAttendance}%` : '',
        ].filter(Boolean)"
        cta-label="Continuar curso"
        :cta-to="`/campus/cursos/${nextCourse.slug}`"
        secondary-label="Ver mis cursos"
        secondary-to="/campus/student/cursos"
        :ring-value="nextCourse.progress_percent"
        ring-label="En este curso"
      />

      <CampusHomeHero
        v-else
        eyebrow="Mi campus"
        title="Hola,"
        :highlight="firstName"
        copy="Todavía no tenés un curso en marcha. Cuando te inscriban, vas a continuar desde acá."
        cta-label="Ver mis cursos"
        cta-to="/campus/student/cursos"
        secondary-label="Ir al buzón"
        secondary-to="/campus/buzon"
      />

      <section v-if="showRhythm" class="home-rhythm" aria-label="Tu ritmo">
        <div v-if="avgProgress > 0 || activeCount > 0" class="home-rhythm__ring-wrap campus-glass">
          <CampusHomeRing :value="avgProgress" size="lg" />
          <span class="home-rhythm__ring-label">Progreso general</span>
        </div>

        <div v-if="showProgressChart" class="home-rhythm__panel campus-glass">
          <h3>Progreso por curso</h3>
          <CampusMiniBarChart :bars="progressChartBars" :max="100" />
          <NuxtLink to="/campus/student/progreso" class="home-rhythm__link">Ver progreso →</NuxtLink>
        </div>

        <div v-else-if="showAttendanceChart" class="home-rhythm__panel campus-glass">
          <h3>Asistencia por curso</h3>
          <CampusMiniBarChart :bars="attendanceChartBars" :max="100" />
          <NuxtLink to="/campus/student/asistencia" class="home-rhythm__link">Ver asistencia →</NuxtLink>
        </div>
      </section>

      <section
        v-if="showAttendanceChart && showProgressChart"
        class="home-rhythm__panel campus-glass"
        aria-label="Asistencia"
      >
        <h3>Asistencia por curso</h3>
        <CampusMiniBarChart :bars="attendanceChartBars" :max="100" />
        <NuxtLink to="/campus/student/asistencia" class="home-rhythm__link">Ver asistencia →</NuxtLink>
      </section>

      <CampusHomeToolkit :tools="toolkit" />

      <CampusHomeQueue
        :items="queueItems"
        empty-text="Estás al día. Cuando haya clases, mensajes o pendientes, aparecen acá."
      />
    </template>
  </div>
</template>
