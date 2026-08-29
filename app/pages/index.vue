<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { brand } = useAppBrand()

usePublicSeo(computed(() => ({
  title: `${brand.name} — Consultoría estratégica y desarrollo humano`,
  description: 'Consultoría estratégica, coaching ontológico y desarrollo humano para organizaciones y equipos.',
})))
</script>

<template>
  <div class="site-page">
    <SiteHeader />
    <main id="main-content">
      <SiteHero />
      <SiteAbout />
      <SiteOrganizations />
      <SiteServices />
      <SiteMethod />
      <SiteTeam />
      <SiteTestimonials />
      <SiteContact />
    </main>
  </div>
</template>
