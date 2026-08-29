<script setup lang="ts">
import { TEACHER_COMMS_HUB_PATH } from '~/utils/campus-comms-paths'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['docente', 'tutor', 'coordinador'],
})

await navigateTo(TEACHER_COMMS_HUB_PATH, { replace: true })
</script>

<template>
  <p class="redirect-hint">Redirigiendo…</p>
</template>

<style scoped>
.redirect-hint {
  padding: 2rem;
  color: var(--campus-muted);
}
</style>
