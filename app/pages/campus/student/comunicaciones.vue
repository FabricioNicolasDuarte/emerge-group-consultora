<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['alumno'],
  campusNav: {
    panel: 'student',
    group: 'Comunicación',
    label: 'Comunicaciones',
    icon: 'comunicaciones',
    order: 1,
  },
})
</script>

<template>
  <CampusCommsHub />
</template>
