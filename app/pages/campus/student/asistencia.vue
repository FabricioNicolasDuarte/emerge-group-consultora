<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['alumno'],
  campusNav: {
    panel: 'student',
    group: 'Panel',
    label: 'Asistencia',
    icon: 'horarios',
    order: 3,
  },
})

import { ATTENDANCE_LABELS, type AttendanceStatus } from '~/types/tracking'

const {
  attendanceSummary,
  recentAttendance,
  loading,
  loadData,
  avgAttendance,
} = useStudentCampusData()
const { fetchMyAttendance } = useCourseTracking()

const fullHistory = ref<Awaited<ReturnType<typeof fetchMyAttendance>>>([])
const selectedCourseId = ref<string | 'all'>('all')

onMounted(async () => {
  await loadData()
  fullHistory.value = await fetchMyAttendance().catch(() => [])
})

const filteredHistory = computed(() => {
  if (selectedCourseId.value === 'all') return fullHistory.value
  return fullHistory.value.filter((row) => row.course_id === selectedCourseId.value)
})

const statusCounts = computed(() => {
  const counts: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  }
  for (const row of filteredHistory.value) {
    counts[row.status] += 1
  }
  return counts
})

const statusChartBars = computed(() => [
  { label: 'Presente', value: statusCounts.value.present },
  { label: 'Tarde', value: statusCounts.value.late },
  { label: 'Ausente', value: statusCounts.value.absent },
  { label: 'Justificado', value: statusCounts.value.excused },
])

const courseChartBars = computed(() =>
  attendanceSummary.value.map((r) => ({
    label: r.course_title.length > 24 ? `${r.course_title.slice(0, 24)}…` : r.course_title,
    value: r.attendance_percent,
  })),
)

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="MI PERFIL DE ASISTENCIA"
      title="Asistencias y ausencias"
      description="Reflejo de lo que cargan el docente o el superadmin después de cada encuentro. No podés autogestionar tu asistencia."
    />

    <p v-if="loading" class="empty-message">Cargando asistencia…</p>
    <p v-else-if="!attendanceSummary.length && !fullHistory.length" class="empty-message">
      Todavía no hay registros de asistencia en tus cursos.
    </p>

    <template v-else>
      <section class="profile-kpis">
        <article class="tracking-card campus-card">
          <span class="course-category">Promedio general</span>
          <strong>{{ avgAttendance }}%</strong>
          <p>Asistencia ponderada por curso</p>
        </article>
        <article class="tracking-card campus-card">
          <span class="course-category">Registros</span>
          <strong>{{ fullHistory.length }}</strong>
          <p>Encuentros con marca</p>
        </article>
        <article class="tracking-card campus-card">
          <span class="course-category">Ausencias</span>
          <strong>{{ statusCounts.absent }}</strong>
          <p>{{ statusCounts.excused }} justificadas</p>
        </article>
      </section>

      <section v-if="courseChartBars.length" class="chart-panel campus-card">
        <h2>Asistencia por curso</h2>
        <CampusMiniBarChart :bars="courseChartBars" :max="100" />
      </section>

      <section v-if="filteredHistory.length" class="chart-panel campus-card">
        <div class="chart-panel__head">
          <h2>Composición (general → detalle)</h2>
          <select v-model="selectedCourseId" aria-label="Filtrar por curso">
            <option value="all">Todos los cursos</option>
            <option
              v-for="row in attendanceSummary"
              :key="row.course_id"
              :value="row.course_id"
            >
              {{ row.course_title }}
            </option>
          </select>
        </div>
        <CampusMiniBarChart :bars="statusChartBars" />
      </section>

      <section class="tracking-grid">
        <article
          v-for="row in attendanceSummary"
          :key="row.course_id"
          class="tracking-card campus-card"
          role="button"
          tabindex="0"
          @click="selectedCourseId = row.course_id"
          @keydown.enter.prevent="selectedCourseId = row.course_id"
        >
          <span class="course-category">{{ row.course_title }}</span>
          <strong>{{ row.attendance_percent }}%</strong>
          <p>{{ row.attended_sessions }} de {{ row.total_sessions }} encuentros</p>
        </article>
      </section>

      <section class="history-panel campus-card">
        <h2>Historial detallado</h2>
        <p v-if="!filteredHistory.length" class="empty-message">Sin registros en este filtro.</p>
        <div v-else class="records-list">
          <div v-for="row in filteredHistory" :key="row.id" class="record-row">
            <div>
              <strong>{{ row.session_title }}</strong>
              <small>{{ row.course_title }} · {{ formatDate(row.session_date) }}</small>
              <small v-if="row.notes" class="record-notes">Motivo: {{ row.notes }}</small>
            </div>
            <span class="status-pill" :class="row.status">
              {{ ATTENDANCE_LABELS[row.status] }}
            </span>
          </div>
        </div>
      </section>

      <p v-if="recentAttendance.length && !fullHistory.length" class="empty-message">
        Mostrando resumen reciente…
      </p>
    </template>
  </div>
</template>

<style scoped>
.profile-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.chart-panel,
.history-panel {
  padding: 1.1rem 1.2rem;
  margin-bottom: 1rem;
}
.chart-panel h2,
.history-panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
}
.chart-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.chart-panel__head h2 {
  margin: 0;
}
.chart-panel__head select {
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(13, 44, 84, 0.16);
  padding: 0.35rem 0.65rem;
}
.records-list {
  display: flex;
  flex-direction: column;
}
.record-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(13, 44, 84, 0.08);
}
.record-notes {
  display: block;
  color: var(--campus-muted);
}
.status-pill {
  display: inline-flex;
  align-items: center;
  height: fit-content;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  background: rgba(13, 44, 84, 0.08);
}
.status-pill.present,
.status-pill.late {
  background: var(--eg-success-bg);
  color: var(--eg-success);
}
.status-pill.absent {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}
.status-pill.excused {
  background: rgba(242, 140, 40, 0.16);
  color: var(--eg-accent);
}
@media (max-width: 768px) {
  .profile-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
