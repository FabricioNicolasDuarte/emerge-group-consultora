<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { HomePulseItem } from '~/types/campus-home'

defineProps<{
  items: HomePulseItem[]
}>()

function isExternal(to?: string, external?: boolean) {
  if (external) return true
  return Boolean(to && /^https?:\/\//i.test(to))
}
</script>

<template>
  <div v-if="items.length" class="home-pulse" role="list">
    <template v-for="item in items" :key="item.id">
      <a
        v-if="item.to && isExternal(item.to, item.external)"
        :href="item.to"
        class="home-pulse__item"
        :class="{
          'home-pulse__item--alert': item.tone === 'alert',
          'home-pulse__item--muted': item.tone === 'muted',
        }"
        target="_blank"
        rel="noopener noreferrer"
        role="listitem"
      >
        <Icon v-if="item.icon" :icon="item.icon" class="home-pulse__icon" aria-hidden="true" />
        {{ item.label }}
      </a>
      <NuxtLink
        v-else-if="item.to"
        :to="item.to"
        class="home-pulse__item"
        :class="{
          'home-pulse__item--alert': item.tone === 'alert',
          'home-pulse__item--muted': item.tone === 'muted',
        }"
        role="listitem"
      >
        <Icon v-if="item.icon" :icon="item.icon" class="home-pulse__icon" aria-hidden="true" />
        {{ item.label }}
      </NuxtLink>
      <span
        v-else
        class="home-pulse__item"
        :class="{
          'home-pulse__item--alert': item.tone === 'alert',
          'home-pulse__item--muted': item.tone === 'muted',
        }"
        role="listitem"
      >
        <Icon v-if="item.icon" :icon="item.icon" class="home-pulse__icon" aria-hidden="true" />
        {{ item.label }}
      </span>
    </template>
  </div>
</template>
