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
  anunciosNuevoPath,
  comunicacionesPath,
  anuncioEditarPath,
} = useCampusStaffPaths()

const announcements = ref<AdminAnnouncement[]>([])
const loading = ref(true)
const errorMessage = ref('')

useTrackFenixLoader(loading)

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

function statusPill(status: string) {
  if (status === 'published') return 'mgmt-pill--ok'
  if (status === 'archived') return 'mgmt-pill--draft'
  return 'mgmt-pill--soft'
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
  <div class="campus-mgmt-ambient">
    <CampusPageHeader
      eyebrow="Comunicación visual"
      title="Editor de anuncios"
      description="Diseñá avisos con tipografías, colores, íconos, imágenes y videos."
    >
      <template #actions>
        <CampusAdminCampusTableIconBtn
          icon="mdi:view-dashboard-outline"
          label="Centro de comunicación"
          :to="comunicacionesPath"
        />
        <CampusAdminCampusTableIconBtn
          icon="mdi:plus"
          label="Nuevo anuncio"
          :to="anunciosNuevoPath"
        />
      </template>
    </CampusPageHeader>

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando anuncios…</p>

    <div v-else-if="!announcements.length" class="mgmt-empty campus-glass">
      <p>Todavía no hay anuncios. Creá el primero con el editor visual.</p>
      <NuxtLink :to="anunciosNuevoPath" class="empty-cta">Crear anuncio →</NuxtLink>
    </div>

    <div v-else class="mgmt-announcement-list">
      <article
        v-for="row in announcements"
        :key="row.id"
        class="mgmt-announcement-card campus-glass"
      >
        <CampusAnnouncementRenderer :announcement="row" compact />
        <div class="mgmt-announcement-card__meta">
          <span class="mgmt-pill mgmt-pill--soft">{{ AUDIENCE_LABELS[row.audience] }}</span>
          <span class="mgmt-pill" :class="statusPill(row.status)">{{ statusLabel(row.status) }}</span>
          <div class="mgmt-announcement-card__actions">
            <CampusAdminCampusTableIconBtn
              icon="mdi:pencil-outline"
              label="Editar"
              :to="anuncioEditarPath(row.id)"
            />
            <CampusAdminCampusTableIconBtn
              icon="mdi:eye-outline"
              label="Vista pública"
              :to="`/campus/anuncios/${row.id}`"
            />
            <CampusAdminCampusTableIconBtn
              :icon="row.status === 'published' ? 'mdi:eye-off-outline' : 'mdi:publish'"
              :label="row.status === 'published' ? 'Ocultar' : 'Publicar'"
              @click="onToggle(row)"
            />
            <CampusAdminCampusTableIconBtn
              icon="mdi:trash-can-outline"
              label="Eliminar"
              danger
              @click="onDelete(row.id)"
            />
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
