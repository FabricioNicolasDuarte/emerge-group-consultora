<script setup lang="ts">
const { showFooter } = useMarketingFooter()
const { brand } = useAppBrand()

useAppColors()

useHead({
  htmlAttrs: { lang: 'es-AR' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:wght@400;600;700&display=swap',
    },
    { rel: 'icon', type: 'image/svg+xml', href: brand.logos.favicon },
    { rel: 'alternate icon', type: 'image/x-icon', href: brand.logos.faviconIco },
  ],
})
</script>

<template>
  <div class="app-shell">
    <PublicSkipLink />
    <div class="app-shell__content">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
    <AppFooter v-if="showFooter" />
  </div>
</template>
