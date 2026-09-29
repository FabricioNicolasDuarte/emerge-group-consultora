<script setup lang="ts">
import type { PublicAnnouncement } from '~/types/comms'
import { formatSupabaseError } from '~/utils/supabase-error'

definePageMeta({ layout: false })

const route = useRoute()
const { brand } = useAppBrand()
const { fetchPublicAnnouncementById } = useCampusComms()
const { user, dashboardPath } = useCampusAuth()

const id = computed(() => String(route.params.id || ''))
const announcement = ref<PublicAnnouncement | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const notFound = ref(false)

useTrackFenixLoader(loading)

usePublicSeo(computed(() => ({
  title: announcement.value
    ? `${announcement.value.title} — Campus ${brand.shortName}`
    : `Aviso — Campus ${brand.shortName}`,
  description: announcement.value?.excerpt
    || announcement.value?.body?.slice(0, 160)
    || `Anuncio del Campus virtual de ${brand.name}.`,
})))

onMounted(async () => {
  if (!id.value) {
    notFound.value = true
    loading.value = false
    return
  }
  try {
    const row = await fetchPublicAnnouncementById(id.value)
    if (!row) {
      notFound.value = true
    } else {
      announcement.value = row as PublicAnnouncement
    }
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error) || 'No se pudo cargar el aviso.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="campus-public">
    <CampusPublicHeader
      :user="user"
      :dashboard-path="dashboardPath"
      :show-announcements="true"
    />
    <main id="main-content" class="campus-public__section campus-public__section--white">
      <div class="campus-public__container anuncio-detail">
        <p class="anuncio-nav">
          <NuxtLink to="/campus/anuncios">← Todos los avisos</NuxtLink>
          <span aria-hidden="true"> · </span>
          <NuxtLink to="/campus">Campus</NuxtLink>
        </p>

        <p v-if="loading" class="anuncios-status">Cargando aviso…</p>
        <p v-else-if="errorMessage" class="anuncios-status anuncios-status--error" role="alert">
          {{ errorMessage }}
        </p>
        <div v-else-if="notFound" class="anuncios-status">
          <h1 class="campus-public__title">Aviso no encontrado</h1>
          <p>Este anuncio no existe o ya no está publicado.</p>
          <NuxtLink to="/campus/anuncios">Ver avisos públicos</NuxtLink>
        </div>

        <CampusAnnouncementRenderer
          v-else-if="announcement"
          :announcement="announcement"
        />
      </div>
    </main>
    <CampusPublicWhatsapp />
    <CampusFenixLoader />
  </div>
</template>

<style scoped>
.anuncio-detail {
  padding-block: 2rem 4rem;
  max-width: 820px;
}
.anuncio-nav {
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
}
.anuncio-nav a {
  color: var(--eg-action);
  font-weight: 700;
  text-decoration: none;
}
.anuncios-status {
  color: var(--eg-muted);
}
.anuncios-status--error {
  color: #b42318;
}
.anuncios-status a {
  color: var(--eg-action);
  font-weight: 700;
}
</style>
