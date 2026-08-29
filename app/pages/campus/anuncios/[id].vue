<script setup lang="ts">
import type { CampusAnnouncement, PublicAnnouncement } from '~/types/comms'
import { formatSupabaseError } from '~/utils/supabase-error'

definePageMeta({ layout: false })

const route = useRoute()
const id = computed(() => route.params.id as string)
const { fetchPublicAnnouncementById } = useCampusComms()
const { user, dashboardPath } = useCampusAuth()

const announcement = ref<PublicAnnouncement | CampusAnnouncement | null>(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    announcement.value = await fetchPublicAnnouncementById(id.value)
    if (!announcement.value) {
      errorMessage.value = 'Anuncio no encontrado o no disponible.'
    }
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'Error al cargar anuncio')
  } finally {
    loading.value = false
  }
})

usePublicSeo(() => ({
  title: announcement.value?.title
    ? `${announcement.value.title} — Campus Emerge`
    : 'Anuncio — Campus Emerge',
  description: announcement.value?.excerpt
    || announcement.value?.body?.slice(0, 155)
    || 'Novedades y avisos del Campus Emerge.',
}))
</script>

<template>
  <div class="campus-public announcement-view">
    <CampusPublicHeader
      :user="user"
      :dashboard-path="dashboardPath"
    />
    <main id="main-content" class="announcement-view__main">
      <NuxtLink to="/campus#avisos" class="announcement-view__back">
        ← Volver a avisos
      </NuxtLink>

      <p v-if="loading" class="announcement-view__state">Cargando anuncio…</p>
      <p v-else-if="errorMessage" class="announcement-view__state announcement-view__state--error">
        {{ errorMessage }}
      </p>
      <CampusAnnouncementRenderer v-else-if="announcement" :announcement="announcement" />
    </main>
    <CampusPublicWhatsapp />
  </div>
</template>
