<script setup lang="ts">
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
  inProgressCourses,
  progressChartBars,
  attendanceChartBars,
} = useStudentCampusData()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="MI CAMPUS"
      :title="`Hola, ${displayName}`"
      description="Panorama general de tu formación, comunicaciones y progreso."
    />

    <CampusRoleSwitcher />

    <CampusLiveSessions :sessions="liveSessions" />

    <section v-if="!loading" class="student-kpi-grid campus-section">
      <CampusKpiCard label="Cursos activos" :value="activeCount" hint="Programas en curso" />
      <CampusKpiCard label="Progreso general" :value="`${avgProgress}%`" hint="De tu formación completada" />
      <CampusKpiCard label="Asistencia" :value="`${avgAttendance}%`" hint="Promedio en tus cursos" accent />
    </section>

    <section v-if="nextCourse && !loading" class="campus-section">
      <div class="campus-section__head">
        <div>
          <span class="campus-eyebrow">CONTINUAR APRENDIENDO</span>
          <h2>Tu próxima clase</h2>
        </div>
        <NuxtLink to="/campus/student/cursos" class="campus-btn">Ver mis cursos</NuxtLink>
      </div>
      <article class="student-hero-card campus-card">
        <div>
          <span class="student-hero-card__tag">{{ nextCourse.category }}</span>
          <h3>{{ nextCourse.title }}</h3>
          <p>{{ nextCourse.description }}</p>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${nextCourse.progress_percent}%` }" />
          </div>
          <small>{{ nextCourse.progress_percent }}% completado</small>
        </div>
        <NuxtLink :to="`/campus/cursos/${nextCourse.slug}`" class="campus-btn campus-btn--primary">
          Continuar curso
        </NuxtLink>
      </article>
    </section>

    <section class="dashboard-previews campus-section">
      <div class="student-preview-grid">
        <div class="student-preview-card campus-card">
          <h3>Progreso por curso</h3>
          <CampusMiniBarChart v-if="progressChartBars.length" :bars="progressChartBars" :max="100" />
          <p v-else class="muted">Sin datos de progreso todavía.</p>
          <NuxtLink to="/campus/student/progreso">Ver progreso completo →</NuxtLink>
        </div>
        <div class="student-preview-card campus-card">
          <h3>Asistencia por curso</h3>
          <CampusMiniBarChart v-if="attendanceChartBars.length" :bars="attendanceChartBars" :max="100" />
          <p v-else class="muted">Sin registros de asistencia.</p>
          <NuxtLink to="/campus/student/asistencia">Ver asistencia →</NuxtLink>
        </div>
      </div>

      <div class="student-preview-links">
        <CampusSectionPreview
          title="Mis cursos"
          :description="`${enrollments.length} programa(s) asignado(s)`"
          to="/campus/student/cursos"
        />
        <CampusSectionPreview
          title="Mis notas"
          :description="`${grades.length} evaluación(es) publicada(s)`"
          to="/campus/student/notas"
        />
        <CampusSectionPreview title="Comunicaciones" description="Avisos, alertas y buzón" to="/campus/student/comunicaciones" />
        <CampusSectionPreview
          title="Certificados"
          :description="`${certificates.length} certificado(s) emitido(s)`"
          to="/campus/student/certificados"
        />
      </div>
    </section>

    <section v-if="inProgressCourses.length && !loading" class="campus-section">
      <div class="campus-section__head">
        <div>
          <span class="campus-eyebrow">EN CURSO</span>
          <h2>Avance reciente</h2>
        </div>
      </div>
      <div class="student-progress-list">
        <article v-for="course in inProgressCourses.slice(0, 4)" :key="course.enrollment_id" class="student-progress-item campus-card">
          <div class="student-progress-item__top">
            <strong>{{ course.title }}</strong>
            <span>{{ course.progress_percent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${course.progress_percent}%` }" />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
