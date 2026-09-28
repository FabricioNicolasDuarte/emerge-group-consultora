<script setup lang="ts">
import { LEGAL_UPDATED, PRIVACY_SECTIONS } from '~/data/legal-content'

definePageMeta({ layout: false })

const { brand } = useAppBrand()

usePublicSeo({
  title: `Privacidad — ${brand.name}`,
  description: `Política de privacidad del sitio y Campus de ${brand.name}.`,
})
</script>

<template>
  <SiteLegalPage
    eyebrow="Legal"
    title="Política de privacidad"
    lead="Cómo tratamos los datos personales en el sitio y en el Campus Emerge."
    :updated="LEGAL_UPDATED"
  >
    <section v-for="section in PRIVACY_SECTIONS" :key="section.title" class="legal-block">
      <h2>{{ section.title }}</h2>
      <p>{{ section.body }}</p>
    </section>
  </SiteLegalPage>
</template>
