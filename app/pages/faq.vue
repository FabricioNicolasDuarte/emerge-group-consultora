<script setup lang="ts">
import { FAQ_ITEMS } from '~/data/legal-content'

definePageMeta({ layout: false })

const { brand } = useAppBrand()

usePublicSeo({
  title: `Preguntas frecuentes — Campus ${brand.shortName}`,
  description: `Respuestas sobre acceso, cursos, contraseñas y comunicación en el Campus de ${brand.name}.`,
})
</script>

<template>
  <SiteLegalPage
    eyebrow="Ayuda"
    title="Preguntas frecuentes"
    lead="Respuestas rápidas sobre el Campus Emerge. Si no encontrás lo que buscás, escribinos por WhatsApp o correo."
  >
    <details v-for="item in FAQ_ITEMS" :key="item.q" class="legal-faq">
      <summary>{{ item.q }}</summary>
      <p>{{ item.a }}</p>
    </details>
  </SiteLegalPage>
</template>
