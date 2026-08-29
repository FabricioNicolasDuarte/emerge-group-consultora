<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['alumno'],
  campusNav: {
    panel: 'student',
    group: 'Progreso',
    label: 'Mi progreso',
    icon: 'progreso',
    order: 1,
  },
})

const {
  enrollments,
  loading,
  completedCourses,
  inProgressCourses,
  notStartedCourses,
  avgProgress,
  progressChartBars,
} = useStudentCampusData()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="TU EVOLUCIÓN"
      title="Resumen de progreso"
      description="Estado de avance en todos tus programas."
    />

    <p v-if="loading" class="empty-message">Cargando progreso…</p>
    <p v-else-if="!enrollments.length" class="empty-message">
      Cuando te inscribas en un programa, vas a ver tu avance acá.
    </p>
    <template v-else>
      <div class="progress-stats">
        <article class="progress-stat campus-card">
          <strong>{{ completedCourses.length }}</strong>
          <span>Completados</span>
        </article>
        <article class="progress-stat campus-card">
          <strong>{{ inProgressCourses.length }}</strong>
          <span>En curso</span>
        </article>
        <article class="progress-stat campus-card">
          <strong>{{ notStartedCourses.length }}</strong>
          <span>Sin iniciar</span>
        </article>
        <article class="progress-stat highlight campus-card">
          <strong>{{ avgProgress }}%</strong>
          <span>Promedio general</span>
        </article>
      </div>

      <div v-if="progressChartBars.length" class="chart-wrap campus-card">
        <h3>Avance por curso</h3>
        <CampusMiniBarChart :bars="progressChartBars" :max="100" />
      </div>

      <div v-if="inProgressCourses.length" class="student-progress-list">
        <article
          v-for="course in inProgressCourses"
          :key="course.enrollment_id"
          class="student-progress-item campus-card"
        >
          <div class="student-progress-item__top">
            <strong>{{ course.title }}</strong>
            <span>{{ course.progress_percent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${course.progress_percent}%` }" />
          </div>
        </article>
      </div>
    </template>
  </div>
</template>
