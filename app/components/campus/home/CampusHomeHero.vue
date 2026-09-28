<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  highlight?: string
  courseTitle?: string
  copy?: string
  meta?: string[]
  ctaLabel: string
  ctaTo: string
  secondaryLabel?: string
  secondaryTo?: string
  ringValue?: number | null
  ringLabel?: string
  ringNote?: string
}>()
</script>

<template>
  <section class="home-hero" aria-labelledby="home-hero-title">
    <div class="home-hero__grid" aria-hidden="true" />
    <div class="home-hero__glow" aria-hidden="true" />

    <div class="home-hero__main">
      <span v-if="eyebrow" class="home-hero__eyebrow">{{ eyebrow }}</span>
      <h1 id="home-hero-title" class="home-hero__title">
        {{ title }}
        <template v-if="highlight">
          <strong>{{ highlight }}</strong>
        </template>
      </h1>
      <p v-if="courseTitle" class="home-hero__course">{{ courseTitle }}</p>
      <p v-if="copy" class="home-hero__copy">{{ copy }}</p>
      <div v-if="meta?.length" class="home-hero__meta">
        <span v-for="(m, i) in meta" :key="i" class="home-hero__chip">{{ m }}</span>
      </div>
      <div class="home-hero__actions">
        <NuxtLink :to="ctaTo" class="home-hero__cta">{{ ctaLabel }} →</NuxtLink>
        <NuxtLink
          v-if="secondaryLabel && secondaryTo"
          :to="secondaryTo"
          class="home-hero__ghost"
        >
          {{ secondaryLabel }}
        </NuxtLink>
      </div>
    </div>

    <aside v-if="ringValue != null" class="home-hero__aside">
      <CampusHomeRing :value="ringValue" size="lg" light />
      <span v-if="ringLabel" class="home-hero__stat-label">{{ ringLabel }}</span>
      <span v-if="ringNote" class="home-hero__stat-note">{{ ringNote }}</span>
    </aside>
  </section>
</template>
