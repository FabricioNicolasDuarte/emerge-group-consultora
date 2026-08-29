<script setup lang="ts">
import type { PublicAnnouncement } from '~/types/comms'

defineProps<{
  announcements: PublicAnnouncement[]
}>()
</script>

<template>
  <section v-if="announcements.length" id="avisos" class="campus-public__section campus-public__section--white">
    <div class="campus-public__container">
      <div class="campus-public__head">
        <span class="campus-public__kicker">Novedades</span>
        <h2 class="campus-public__title">Avisos del Campus</h2>
      </div>

      <div class="announcements-grid">
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
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </article>
          <NuxtLink :to="`/campus/anuncios/${item.id}`" class="announcement-link">
            Ver anuncio completo
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

