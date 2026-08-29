<script setup lang="ts">
import { CAMPUS_ENTRY_PATH } from '~/utils/campus-shared-routes'

definePageMeta({
  layout: false,
})

await navigateTo(CAMPUS_ENTRY_PATH, { replace: true })
</script>

<template>
  <div class="campus-redirect">
    <p>Redirigiendo…</p>
  </div>
</template>
