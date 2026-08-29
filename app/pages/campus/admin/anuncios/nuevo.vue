<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/anuncios/nuevo'],
})
</script>

<template>
  <div class="campus-page">
    <CampusPageHeader
      eyebrow="Nuevo anuncio"
      title="Editor visual"
    />
    <CampusAnnouncementEditorForm />
  </div>
</template>
