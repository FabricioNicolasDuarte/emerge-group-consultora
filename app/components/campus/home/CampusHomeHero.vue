<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  highlight?: string
  copy?: string
  meta?: string[]
  ctaLabel: string
  ctaTo: string
  secondaryLabel?: string
  secondaryTo?: string
  ringValue?: number | null
  ringLabel?: string
}>()
</script>

<template>
  <section class="home-hero" aria-labelledby="home-hero-title">
    <div>
      <span v-if="eyebrow" class="home-hero__eyebrow">{{ eyebrow }}</span>
      <h1 id="home-hero-title" class="home-hero__title">
        {{ title }}
        <template v-if="highlight">
          <strong>{{ highlight }}</strong>
        </template>
      </h1>
      <p v-if="copy" class="home-hero__copy">{{ copy }}</p>
      <div v-if="meta?.length" class="home-hero__meta">
        <span v-for="(m, i) in meta" :key="i">{{ m }}</span>
      </div>
      <div class="home-hero__actions">
        <NuxtLink :to="ctaTo" class="home-hero__cta">{{ ctaLabel }}</NuxtLink>
        <NuxtLink
          v-if="secondaryLabel && secondaryTo"
          :to="secondaryTo"
          class="home-hero__ghost"
        >
          {{ secondaryLabel }}
        </NuxtLink>
      </div>
    </div>

    <div v-if="ringValue != null" class="home-hero__stat">
      <CampusHomeRing :value="ringValue" size="lg" light />
      <span v-if="ringLabel" class="home-hero__stat-label">{{ ringLabel }}</span>
    </div>
  </section>
</template>
