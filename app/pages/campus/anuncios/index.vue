<script setup lang="ts">
import type { PublicAnnouncement } from '~/types/comms'

definePageMeta({ layout: false })

const { brand } = useAppBrand()
const { fetchPublicAnnouncements } = useCampusComms()
const { user, dashboardPath } = useCampusAuth()

usePublicSeo(computed(() => ({
  title: `Avisos — Campus ${brand.shortName}`,
  description: `Novedades y anuncios públicos del Campus virtual de ${brand.name}.`,
})))

const announcements = ref<PublicAnnouncement[]>([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    announcements.value = await fetchPublicAnnouncements()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar los avisos.'
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
      <div class="campus-public__container anuncios-page">
        <div class="campus-public__head">
          <span class="campus-public__kicker">Novedades</span>
          <h1 class="campus-public__title">Avisos del Campus</h1>
          <p class="campus-public__lead">
            Comunicados públicos de Emerge Group. También podés verlos en la portada del Campus.
          </p>
        </div>

        <p v-if="loading" class="anuncios-status">Cargando avisos…</p>
        <p v-else-if="errorMessage" class="anuncios-status anuncios-status--error" role="alert">
          {{ errorMessage }}
        </p>
        <p v-else-if="!announcements.length" class="anuncios-status">
          No hay avisos publicados por ahora.
        </p>

        <div v-else class="announcements-grid">
          <div
            v-for="item in announcements"
            :key="item.id"
            class="announcement-item"
          >
            <CampusAnnouncementRenderer
              v-if="item.body_html"
              :announcement="item"
              compact
            />
            <article
              v-else
              class="announcement-card"
              :class="{ 'is-pinned': item.is_pinned }"
            >
              <h2>{{ item.title }}</h2>
              <p>{{ item.body }}</p>
            </article>
            <NuxtLink :to="`/campus/anuncios/${item.id}`" class="announcement-link">
              Ver anuncio completo
            </NuxtLink>
          </div>
        </div>

        <p class="anuncios-back">
          <NuxtLink to="/campus">← Volver al Campus</NuxtLink>
        </p>
      </div>
    </main>
    <CampusPublicWhatsapp />
  </div>
</template>

<style scoped>
.anuncios-page {
  padding-block: 2.5rem 4rem;
}
.anuncios-status {
  color: var(--eg-muted);
  margin: 1.5rem 0;
}
.anuncios-status--error {
  color: #b42318;
}
.anuncios-back {
  margin-top: 2.5rem;
}
.anuncios-back a {
  color: var(--eg-action);
  font-weight: 700;
  text-decoration: none;
}
.announcements-grid {
  display: grid;
  gap: 1.5rem;
  margin-top: 1.5rem;
}
.announcement-item {
  display: grid;
  gap: 0.75rem;
}
.announcement-card {
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  background: var(--eg-surface);
  border: 1px solid rgba(13, 44, 84, 0.08);
}
.announcement-card.is-pinned {
  border-color: rgba(242, 140, 40, 0.45);
}
.announcement-card h2 {
  margin: 0 0 0.5rem;
  font-family: var(--eg-font-display);
  font-size: 1.35rem;
  color: var(--eg-ink);
}
.announcement-card p {
  margin: 0;
  color: var(--eg-muted);
  line-height: 1.6;
}
.announcement-link {
  color: var(--eg-action);
  font-weight: 700;
  text-decoration: none;
}
</style>
