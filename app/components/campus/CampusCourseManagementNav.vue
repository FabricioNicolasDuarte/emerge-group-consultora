<script setup lang="ts">
const props = defineProps<{
  courseId: string
  active: 'contenido' | 'asistencia' | 'calificaciones'
}>()

const {
  courseContenidoPath,
  courseAsistenciaPath,
  courseCalificacionesPath,
} = useCampusStaffPaths()

const tabs = computed(() => [
  { key: 'contenido' as const, label: 'Contenido', to: courseContenidoPath(props.courseId) },
  { key: 'asistencia' as const, label: 'Asistencia', to: courseAsistenciaPath(props.courseId) },
  { key: 'calificaciones' as const, label: 'Calificaciones', to: courseCalificacionesPath(props.courseId) },
])
</script>

<template>
  <nav class="course-mgmt-nav" aria-label="Gestión del curso">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      class="course-mgmt-nav__item"
      :class="{ 'is-active': active === tab.key }"
    >
      {{ tab.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.course-mgmt-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.course-mgmt-nav__item {
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(13, 44, 84, 0.12);
  background: white;
  color: #4a5d73;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
}

.course-mgmt-nav__item.is-active {
  background: #0D2C54;
  border-color: #0D2C54;
  color: white;
}
</style>
