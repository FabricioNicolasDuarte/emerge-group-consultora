<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['docente', 'tutor', 'coordinador'],
  campusNav: {
    panel: 'teacher',
    group: 'Panel',
    label: 'Mis cursos',
    icon: 'misCursos',
    order: 2,
  },
})

const { courses, loading } = useTeacherCampusData()
const {
  courseHubPath,
  courseContenidoPath,
  courseAlumnosPath,
  courseAsistenciaPath,
  courseCalificacionesPath,
} = useCampusStaffPaths()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="MIS PROGRAMAS"
      title="Cursos asignados"
      description="Entrá al curso para gestionar contenido, alumnos, asistencia y notas."
    />

    <p v-if="loading" class="empty-message">Cargando cursos…</p>
    <p v-else-if="!courses.length" class="empty-message">
      Todavía no tenés cursos asignados. Pedí a administración que te asigne como docente.
    </p>
    <div v-else class="courses-grid">
      <article v-for="course in courses" :key="course.assignment_id" class="course-card campus-card">
        <span class="course-category">{{ course.category }}</span>
        <h3>{{ course.title }}</h3>
        <p>{{ course.description }}</p>
        <div class="course-footer">
          <span>{{ course.enrollment_count }} alumnos</span>
          <div class="course-links">
            <NuxtLink :to="courseHubPath(course.course_id)">Abrir curso →</NuxtLink>
            <NuxtLink :to="courseContenidoPath(course.course_id)">Contenido</NuxtLink>
            <NuxtLink :to="courseAlumnosPath(course.course_id)">Alumnos</NuxtLink>
            <NuxtLink :to="courseAsistenciaPath(course.course_id)">Asistencia</NuxtLink>
            <NuxtLink :to="courseCalificacionesPath(course.course_id)">Notas</NuxtLink>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
