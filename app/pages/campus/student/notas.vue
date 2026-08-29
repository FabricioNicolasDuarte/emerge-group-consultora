<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['alumno'],
  campusNav: {
    panel: 'student',
    group: 'Panel',
    label: 'Mis notas',
    icon: 'analitica',
    order: 4,
  },
})

const { grades, courseAverages, loading } = useStudentCampusData()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="EVALUACIONES"
      title="Mis notas"
      description="Calificaciones y feedback de tus evaluaciones."
    />

    <p v-if="loading" class="empty-message">Cargando notas…</p>
    <p v-else-if="!grades.length" class="empty-message">
      Todavía no tenés notas publicadas.
    </p>
    <template v-else>
      <div v-if="courseAverages.length" class="tracking-grid">
        <article
          v-for="row in courseAverages.filter(r => r.average_percent != null)"
          :key="row.course_id"
          class="tracking-card campus-card"
        >
          <span class="course-category">{{ row.course_title }}</span>
          <strong>{{ row.average_percent }}%</strong>
          <p>{{ row.graded_count }} evaluaciones calificadas</p>
        </article>
      </div>
      <div class="records-list">
        <div v-for="row in grades" :key="row.id" class="record-row">
          <div>
            <strong>{{ row.assessment_title }}</strong>
            <small>
              {{ row.course_title }}
              <template v-if="row.due_date">
                · Entrega {{ new Date(row.due_date).toLocaleDateString('es-AR') }}
              </template>
            </small>
            <p v-if="row.feedback" class="feedback">{{ row.feedback }}</p>
          </div>
          <div class="grade-score">
            <strong>{{ row.score ?? '—' }}</strong>
            <small>/ {{ row.max_score }}</small>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.feedback {
  margin: 0.4rem 0 0;
  color: var(--campus-muted, #66768a);
  font-size: 0.84rem;
}
</style>
