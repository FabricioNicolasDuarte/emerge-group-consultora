<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['alumno'],
  campusNav: {
    panel: 'student',
    group: 'Panel',
    label: 'Mis cursos',
    icon: 'misCursos',
    order: 2,
  },
})

const { enrollments, loading } = useStudentCampusData()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="MI FORMACIÓN"
      title="Mis cursos"
      description="Todos los programas en los que estás inscripto."
    />

    <div v-if="loading" class="empty-message">Cargando tus cursos…</div>
    <div v-else-if="!enrollments.length" class="empty-message">
      No tenés cursos asignados todavía.
      <NuxtLink to="/campus#programas" class="empty-cta">Ver programas disponibles →</NuxtLink>
    </div>
    <div v-else class="courses-grid">
      <article v-for="course in enrollments" :key="course.enrollment_id" class="course-card campus-card">
        <span class="course-category">{{ course.category }}</span>
        <h3>{{ course.title }}</h3>
        <p>{{ course.description }}</p>
        <div class="progress-bar" style="margin: 0.75rem 0">
          <div class="progress" :style="{ width: `${course.progress_percent}%` }" />
        </div>
        <div class="course-footer">
          <span>{{ course.progress_percent }}%</span>
          <NuxtLink :to="`/campus/cursos/${course.slug}`">
            {{ course.progress_percent > 0 ? 'Continuar →' : 'Comenzar →' }}
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
