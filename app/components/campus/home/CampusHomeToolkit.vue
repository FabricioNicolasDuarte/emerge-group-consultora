<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { HomeToolkitItem } from '~/types/campus-home'

defineProps<{
  tools: HomeToolkitItem[]
}>()
</script>

<template>
  <nav class="home-toolkit" aria-label="Herramientas rápidas">
    <NuxtLink
      v-for="tool in tools"
      :key="tool.id"
      :to="tool.to"
      class="home-toolkit__item campus-glass"
    >
      <div class="home-toolkit__head">
        <span class="home-toolkit__icon" aria-hidden="true">
          <Icon :icon="tool.icon" />
        </span>
        <span v-if="tool.badge != null && tool.badge !== '' && tool.badge !== 0" class="home-toolkit__badge">
          {{ tool.badge }}
        </span>
      </div>
      <span class="home-toolkit__label">{{ tool.label }}</span>
      <span class="home-toolkit__hint">{{ tool.hint }}</span>
    </NuxtLink>
  </nav>
</template>
