<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = defineProps<{
  courseId: string
  active: 'resumen' | 'contenido' | 'alumnos' | 'asistencia' | 'calificaciones'
}>()

const {
  courseHubPath,
  courseContenidoPath,
  courseAlumnosPath,
  courseAsistenciaPath,
  courseCalificacionesPath,
} = useCampusStaffPaths()

const tabs = computed(() => [
  { key: 'resumen' as const, label: 'Resumen', icon: 'mdi:view-dashboard-outline', to: courseHubPath(props.courseId) },
  { key: 'contenido' as const, label: 'Contenido', icon: 'mdi:play-box-multiple-outline', to: courseContenidoPath(props.courseId) },
  { key: 'alumnos' as const, label: 'Alumnos', icon: 'mdi:account-group-outline', to: courseAlumnosPath(props.courseId) },
  { key: 'asistencia' as const, label: 'Asistencia', icon: 'mdi:calendar-check-outline', to: courseAsistenciaPath(props.courseId) },
  { key: 'calificaciones' as const, label: 'Notas', icon: 'mdi:clipboard-text-outline', to: courseCalificacionesPath(props.courseId) },
])
</script>

<template>
  <nav class="course-mgmt-nav campus-glass campus-glass--soft" aria-label="Gestión del curso">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.key"
      :to="tab.to"
      class="course-mgmt-nav__item"
      :class="{ 'is-active': active === tab.key }"
    >
      <Icon :icon="tab.icon" width="18" height="18" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.course-mgmt-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1.35rem;
  padding: 0.4rem;
}

.course-mgmt-nav__item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  border: 1px solid transparent;
  color: var(--eg-ink-soft);
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.course-mgmt-nav__item:hover {
  background: rgba(255, 255, 255, 0.65);
  color: var(--eg-ink);
}

.course-mgmt-nav__item.is-active {
  background: linear-gradient(135deg, var(--eg-ink) 0%, var(--eg-ink-mid) 100%);
  color: #fff;
  box-shadow: 0 8px 20px rgba(13, 44, 84, 0.18);
}

@media (max-width: 560px) {
  .course-mgmt-nav__item span {
    display: none;
  }

  .course-mgmt-nav__item {
    padding: 0.6rem;
  }

  .course-mgmt-nav__item.is-active span {
    display: inline;
  }
}
</style>
