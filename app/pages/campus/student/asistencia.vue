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

import { ATTENDANCE_LABELS } from '~/types/tracking'

const { attendanceSummary, recentAttendance, loading } = useStudentCampusData()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="ENCUENTROS"
      title="Mi asistencia"
      description="Resumen de participación en tus clases y encuentros."
    />

    <p v-if="loading" class="empty-message">Cargando asistencia…</p>
    <p v-else-if="!attendanceSummary.length" class="empty-message">
      Todavía no hay registros de asistencia en tus cursos.
    </p>
    <template v-else>
      <div class="tracking-grid">
        <article
          v-for="row in attendanceSummary"
          :key="row.course_id"
          class="tracking-card campus-card"
        >
          <span class="course-category">{{ row.course_title }}</span>
          <strong>{{ row.attendance_percent }}%</strong>
          <p>{{ row.attended_sessions }} de {{ row.total_sessions }} encuentros</p>
        </article>
      </div>
      <div v-if="recentAttendance.length" class="records-list">
        <div v-for="row in recentAttendance" :key="row.id" class="record-row">
          <div>
            <strong>{{ row.session_title }}</strong>
            <small>{{ row.course_title }} · {{ new Date(row.session_date).toLocaleDateString('es-AR') }}</small>
          </div>
          <span class="status-pill" :class="row.status">
            {{ ATTENDANCE_LABELS[row.status] }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
