<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  lead?: string
  updated?: string
}>()
</script>

<template>
  <div class="legal-page">
    <SiteHeader />
    <main id="main-content" class="legal-page__main">
      <div class="legal-page__container">
        <header class="legal-page__header">
          <span class="legal-page__eyebrow">{{ eyebrow }}</span>
          <h1>{{ title }}</h1>
          <p v-if="lead" class="legal-page__lead">{{ lead }}</p>
          <p v-if="updated" class="legal-page__updated">Actualizado: {{ updated }}</p>
        </header>
        <div class="legal-page__body">
          <slot />
        </div>
        <nav class="legal-page__nav" aria-label="Documentos relacionados">
          <NuxtLink to="/nosotros">Nosotros</NuxtLink>
          <NuxtLink to="/faq">FAQ</NuxtLink>
          <NuxtLink to="/privacidad">Privacidad</NuxtLink>
          <NuxtLink to="/terminos">Términos</NuxtLink>
          <NuxtLink to="/cookies">Cookies</NuxtLink>
          <NuxtLink to="/campus">Campus</NuxtLink>
        </nav>
      </div>
    </main>
  </div>
</template>
