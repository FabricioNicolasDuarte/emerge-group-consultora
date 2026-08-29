<script setup lang="ts">
import { STUDENT_COMMS_HUB_PATH } from '~/utils/campus-comms-paths'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['alumno'],
})

await navigateTo(STUDENT_COMMS_HUB_PATH, { replace: true })
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
