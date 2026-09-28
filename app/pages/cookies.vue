<script setup lang="ts">
import { COOKIES_SECTIONS, LEGAL_UPDATED } from '~/data/legal-content'

definePageMeta({ layout: false })

const { brand } = useAppBrand()

usePublicSeo({
  title: `Cookies — ${brand.name}`,
  description: `Información sobre cookies y tecnologías similares en ${brand.name}.`,
})
</script>

<template>
  <SiteLegalPage
    eyebrow="Legal"
    title="Política de cookies"
    lead="Uso de cookies y almacenamiento local en el sitio y el Campus."
    :updated="LEGAL_UPDATED"
  >
    <section v-for="section in COOKIES_SECTIONS" :key="section.title" class="legal-block">
      <h2>{{ section.title }}</h2>
      <p>{{ section.body }}</p>
    </section>
    <p class="legal-block">
      Más detalle sobre datos personales en la
      <NuxtLink to="/privacidad">Política de privacidad</NuxtLink>.
    </p>
  </SiteLegalPage>
</template>
