<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/comunicaciones'],
  campusNav: [
    {
      panel: 'teacher',
      group: 'Comunicación',
      label: 'Comunicaciones',
      icon: 'comunicaciones',
      order: 1,
      to: '/campus/teacher/comunicaciones',
    },
    {
      panel: 'admin',
      group: 'Sistema',
      label: 'Comunicaciones',
      icon: 'comunicaciones',
      order: 2,
      to: '/campus/admin/comunicaciones',
    },
  ],
})
</script>

<template>
  <CampusCommsHub />
</template>
