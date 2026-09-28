<script setup lang="ts">
import type { HomeQueueItem } from '~/types/campus-home'

defineProps<{
  title?: string
  items: HomeQueueItem[]
  emptyText?: string
}>()
</script>

<template>
  <section v-if="items.length || emptyText" class="home-queue">
    <div class="home-queue__head">
      <h3>{{ title || 'Requiere tu atención' }}</h3>
      <span v-if="items.length">{{ items.length }} ítem{{ items.length === 1 ? '' : 's' }}</span>
    </div>

    <p v-if="!items.length" class="home-queue__empty">
      {{ emptyText || 'Nada pendiente por ahora.' }}
    </p>

    <ul v-else class="home-queue__list">
      <li v-for="item in items" :key="item.id">
        <NuxtLink :to="item.to" class="home-queue__item">
          <span
            class="home-queue__bullet"
            :class="{
              'home-queue__bullet--info': item.tone === 'info',
              'home-queue__bullet--muted': item.tone === 'muted',
            }"
            aria-hidden="true"
          />
          <span class="home-queue__body">
            <span class="home-queue__title">{{ item.title }}</span>
            <span v-if="item.subtitle" class="home-queue__sub">{{ item.subtitle }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
