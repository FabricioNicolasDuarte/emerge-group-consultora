<script setup lang="ts">
import { ABOUT_PAGE } from '~/data/legal-content'

definePageMeta({ layout: false })

const { brand } = useAppBrand()

usePublicSeo({
  title: `Nosotros — ${brand.name}`,
  description: ABOUT_PAGE.lead,
})
</script>

<template>
  <SiteLegalPage
    :eyebrow="ABOUT_PAGE.eyebrow"
    :title="ABOUT_PAGE.title"
    :lead="ABOUT_PAGE.lead"
  >
    <section v-for="section in ABOUT_PAGE.sections" :key="section.title" class="legal-block">
      <h2>{{ section.title }}</h2>
      <p>{{ section.body }}</p>
    </section>
    <p class="legal-block">
      <NuxtLink to="/campus" class="legal-cta">Ir al Campus →</NuxtLink>
    </p>
  </SiteLegalPage>
</template>
