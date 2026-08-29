<script setup lang="ts">
import type { AdminAnnouncement } from '~/types/comms'
import { AUDIENCE_LABELS } from '~/types/comms'
import { formatSupabaseError } from '~/utils/supabase-error'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/anuncios'],
  campusNav: {
    panel: 'teacher',
    group: 'Comunicación',
    label: 'Anuncios',
    icon: 'anuncios',
    order: 2,
    to: '/campus/teacher/anuncios',
  },
})

const {
  fetchAdminAnnouncements,
  updateAnnouncementStatus,
  deleteAnnouncement,
} = useCampusComms()

const {
  anunciosPath,
  anunciosNuevoPath,
  comunicacionesPath,
  anuncioEditarPath,
} = useCampusStaffPaths()

const announcements = ref<AdminAnnouncement[]>([])
const loading = ref(true)
const errorMessage = ref('')

async function loadData() {
  loading.value = true
  try {
    announcements.value = await fetchAdminAnnouncements()
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'Error al cargar anuncios')
  } finally {
    loading.value = false
  }
}

function statusLabel(status: string) {
  if (status === 'published') return 'Publicado'
  if (status === 'archived') return 'Archivado'
  return 'Borrador'
}

async function onToggle(row: AdminAnnouncement) {
  const next = row.status === 'published' ? 'draft' : 'published'
  await updateAnnouncementStatus(row.id, next)
  await loadData()
}

async function onDelete(id: string) {
  if (!confirm('¿Eliminar este anuncio y sus medios?')) return
  await deleteAnnouncement(id)
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="Comunicación visual"
      title="Editor de anuncios"
      description="Diseñá avisos con tipografías, colores, íconos, imágenes y videos."
    >
      <template #actions>
        <div class="campus-course-actions">
          <NuxtLink :to="comunicacionesPath" class="campus-btn">Centro de comunicación →</NuxtLink>
          <NuxtLink :to="anunciosNuevoPath" class="campus-btn campus-btn--primary">+ Nuevo anuncio</NuxtLink>
        </div>
      </template>
    </CampusPageHeader>

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="campus-banner">Cargando anuncios…</p>

    <div v-else-if="!announcements.length" class="campus-admin-empty">
      <p>Todavía no hay anuncios. Creá el primero con el editor visual.</p>
      <NuxtLink :to="anunciosNuevoPath" class="empty-cta">Crear anuncio →</NuxtLink>
    </div>

    <div v-else class="announcement-list">
      <article v-for="row in announcements" :key="row.id" class="campus-admin-panel campus-card announcement-card">
        <CampusAnnouncementRenderer :announcement="row" compact />
        <div class="announcement-card__meta">
          <span>{{ AUDIENCE_LABELS[row.audience] }}</span>
          <span>{{ statusLabel(row.status) }}</span>
          <div class="announcement-card__actions">
            <NuxtLink :to="anuncioEditarPath(row.id)">Editar</NuxtLink>
            <NuxtLink :to="`/campus/anuncios/${row.id}`" target="_blank">Vista pública</NuxtLink>
            <button type="button" @click="onToggle(row)">
              {{ row.status === 'published' ? 'Ocultar' : 'Publicar' }}
            </button>
            <button type="button" class="danger" @click="onDelete(row.id)">Eliminar</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
