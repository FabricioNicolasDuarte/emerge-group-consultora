<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { fetchProfile, dashboardPath } = useCampusAuth()

await fetchProfile()
await navigateTo(dashboardPath.value, { replace: true })
</script>

<template>
  <div class="campus-redirect">
    <p>Redirigiendo a tu campus…</p>
  </div>
</template>
