<script setup lang="ts">
import { LEGAL_UPDATED, TERMS_SECTIONS } from '~/data/legal-content'

definePageMeta({ layout: false })

const { brand } = useAppBrand()

usePublicSeo({
  title: `Términos de uso — ${brand.name}`,
  description: `Condiciones de uso del sitio y Campus de ${brand.name}.`,
})
</script>

<template>
  <SiteLegalPage
    eyebrow="Legal"
    title="Términos de uso"
    lead="Condiciones para usar el sitio web y el Campus Emerge."
    :updated="LEGAL_UPDATED"
  >
    <section v-for="section in TERMS_SECTIONS" :key="section.title" class="legal-block">
      <h2>{{ section.title }}</h2>
      <p>{{ section.body }}</p>
    </section>
  </SiteLegalPage>
</template>
