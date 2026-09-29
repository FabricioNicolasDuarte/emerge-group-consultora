<script setup lang="ts">
import type { CampusReportSummary, CoursePerformanceRow, EnrollmentReportRow } from '~/types/audit'
import { formatSupabaseError } from '~/utils/supabase-error'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador'],
  campusNav: {
    panel: 'admin',
    group: 'Sistema',
    label: 'Reportes',
    icon: 'analitica',
    order: 1,
  },
})

const user = useSupabaseUser()
const { hasRole } = useCampusAuth()
const {
  fetchCampusReportSummary,
  fetchCoursePerformance,
  fetchEnrollmentReport,
  exportEnrollmentsCsv,
  exportCoursePerformanceCsv,
} = useCampusReports()

const summary = ref<CampusReportSummary>({
  published_courses: 0,
  active_enrollments: 0,
  completed_enrollments: 0,
  avg_progress_percent: 0,
  unique_students: 0,
  activity_last_30_days: 0,
  attendance_rate_percent: 0,
  avg_grade: 0,
})
const courseRows = ref<CoursePerformanceRow[]>([])
const enrollmentRows = ref<EnrollmentReportRow[]>([])
const loading = ref(true)
const errorMessage = ref('')

useTrackFenixLoader(loading)

async function loadData() {
  if (!user.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const [summaryData, performanceRows, enrollments] = await Promise.all([
      fetchCampusReportSummary(),
      fetchCoursePerformance(),
      fetchEnrollmentReport(),
    ])
    summary.value = summaryData
    courseRows.value = performanceRows
    enrollmentRows.value = enrollments
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'Error al cargar reportes')
  } finally {
    loading.value = false
  }
}

function statusLabel(status: string) {
  if (status === 'published') return 'Activo'
  if (status === 'archived') return 'Archivado'
  return 'Borrador'
}

onMounted(() => {
  if (user.value) {
    loadData()
    return
  }
  const stop = watch(user, (current) => {
    if (current) {
      stop()
      loadData()
    }
  }, { immediate: true })
})
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="INFORMACIÓN"
      title="Reportes del campus"
      description="Métricas de participación, progreso, asistencia y rendimiento académico."
    >
      <template #actions>
        <div class="campus-course-actions">
          <button
            type="button"
            class="campus-btn"
            :disabled="loading || !enrollmentRows.length"
            @click="exportEnrollmentsCsv(enrollmentRows)"
          >
            Exportar inscripciones CSV
          </button>
          <button
            type="button"
            class="campus-btn"
            :disabled="loading || !courseRows.length"
            @click="exportCoursePerformanceCsv(courseRows)"
          >
            Exportar rendimiento CSV
          </button>
        </div>
      </template>
    </CampusPageHeader>

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="campus-banner">Cargando…</p>

    <section v-if="!loading" class="campus-kpi-grid">
      <article class="campus-kpi-card campus-card">
        <span>CURSOS ACTIVOS</span>
        <strong>{{ summary.published_courses }}</strong>
      </article>
      <article class="campus-kpi-card campus-card">
        <span>INSCRIPCIONES ACTIVAS</span>
        <strong>{{ summary.active_enrollments }}</strong>
      </article>
      <article class="campus-kpi-card campus-card">
        <span>COMPLETADOS</span>
        <strong>{{ summary.completed_enrollments }}</strong>
      </article>
      <article class="campus-kpi-card campus-card">
        <span>PROGRESO PROMEDIO</span>
        <strong>{{ summary.avg_progress_percent }}%</strong>
      </article>
      <article class="campus-kpi-card campus-card">
        <span>ALUMNOS ÚNICOS</span>
        <strong>{{ summary.unique_students }}</strong>
      </article>
      <article class="campus-kpi-card campus-card">
        <span>ASISTENCIA PROMEDIO</span>
        <strong>{{ summary.attendance_rate_percent }}%</strong>
      </article>
      <article class="campus-kpi-card campus-card">
        <span>NOTA PROMEDIO</span>
        <strong>{{ summary.avg_grade }}</strong>
      </article>
      <article class="campus-kpi-card campus-card">
        <span>ACTIVIDAD (30 DÍAS)</span>
        <strong>{{ summary.activity_last_30_days }}</strong>
      </article>
    </section>

    <section v-if="!loading" class="campus-admin-panel campus-card">
      <div class="campus-admin-panel__top">
        <h2>Rendimiento por curso</h2>
        <NuxtLink v-if="hasRole('superadmin')" to="/campus/admin/auditoria" class="table-link">
          Ver auditoría →
        </NuxtLink>
      </div>

      <p v-if="!courseRows.length" class="campus-admin-empty">No hay cursos cargados todavía.</p>

      <div v-else class="campus-data-table">
        <div class="campus-data-row campus-data-row--performance campus-data-row--header">
          <span>Curso</span>
          <span>Activos</span>
          <span>Completados</span>
          <span>Progreso</span>
          <span>Asistencia</span>
          <span>Nota prom.</span>
          <span>Estado</span>
        </div>
        <div v-for="row in courseRows" :key="row.course_id" class="campus-data-row campus-data-row--performance">
          <div>
            <strong>{{ row.course_title }}</strong>
            <small>{{ row.category }}</small>
          </div>
          <span>{{ row.active_enrollments }}</span>
          <span>{{ row.completed_enrollments }}</span>
          <span>{{ row.avg_progress_percent }}%</span>
          <span>{{ row.attendance_rate_percent }}%</span>
          <span>{{ row.avg_grade }}</span>
          <span>{{ statusLabel(row.status) }}</span>
        </div>
      </div>
    </section>

    <section v-if="!loading" class="campus-admin-panel campus-card">
      <h2>Inscripciones (detalle)</h2>
      <p v-if="!enrollmentRows.length" class="campus-admin-empty">No hay inscripciones registradas.</p>

      <div v-else class="campus-data-table">
        <div class="campus-data-row campus-data-row--enrollment campus-data-row--header">
          <span>Alumno</span>
          <span>Curso</span>
          <span>Progreso</span>
          <span>Estado</span>
          <span>Inscripto</span>
        </div>
        <div v-for="row in enrollmentRows.slice(0, 50)" :key="row.id" class="campus-data-row campus-data-row--enrollment">
          <div>
            <strong>{{ row.student_name }}</strong>
            <small>{{ row.student_email }}</small>
          </div>
          <span>{{ row.course_title }}</span>
          <span>{{ row.progress_percent }}%</span>
          <span>{{ row.status }}</span>
          <span>{{ new Date(row.enrolled_at).toLocaleDateString('es-AR') }}</span>
        </div>
        <p v-if="enrollmentRows.length > 50" class="campus-admin-hint">
          Mostrando las primeras 50 de {{ enrollmentRows.length }}. Usá "Exportar inscripciones CSV" para el listado completo.
        </p>
      </div>
    </section>
  </div>
</template>
