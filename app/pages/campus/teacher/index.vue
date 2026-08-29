<script setup lang="ts">
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
const { courses, liveSessions, loading, totalStudents, enrollmentChartBars } = useTeacherCampusData()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="PANEL DOCENTE"
      :title="`Hola, ${displayName}`"
      description="Panorama de tus cursos, alumnos y comunicaciones."
    />
    <CampusRoleSwitcher />
    <CampusLiveSessions :sessions="liveSessions" title="Próximas clases en vivo de tus cursos" />

    <section v-if="!loading" class="student-kpi-grid campus-section">
      <CampusKpiCard label="Mis cursos" :value="courses.length" hint="Programas asignados" />
      <CampusKpiCard label="Alumnos" :value="totalStudents" hint="Total inscriptos" accent />
      <CampusKpiCard label="Rol" value="Docente" hint="Panel de gestión" />
    </section>

    <section class="campus-section">
      <div class="teacher-preview-grid">
        <div class="student-preview-card campus-card">
          <h3>Inscriptos por curso</h3>
          <CampusMiniBarChart v-if="enrollmentChartBars.length" :bars="enrollmentChartBars" />
          <p v-else class="empty-message">Sin cursos asignados.</p>
          <NuxtLink to="/campus/teacher/cursos">Ver mis cursos →</NuxtLink>
        </div>
        <div class="teacher-preview-links-col">
          <CampusSectionPreview title="Mis cursos" :description="`${courses.length} programa(s)`" to="/campus/teacher/cursos" />
          <CampusSectionPreview title="Comunicaciones" description="Avisos, alertas y buzón" to="/campus/teacher/comunicaciones" />
          <CampusSectionPreview title="Mi buzón" description="Mensajes internos" to="/campus/buzon" />
        </div>
      </div>
    </section>
  </div>
</template>
