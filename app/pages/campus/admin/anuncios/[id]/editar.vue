<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/anuncios/:id/editar'],
})

const route = useRoute()
const announcementId = computed(() => route.params.id as string)
</script>

<template>
  <div class="campus-page">
    <CampusPageHeader
      eyebrow="Editar anuncio"
      title="Editor visual"
    />
    <CampusAnnouncementEditorForm :announcement-id="announcementId ?? undefined" />
  </div>
</template>
