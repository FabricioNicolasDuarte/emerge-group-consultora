<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  lead?: string
  updated?: string
  backTo?: string
  backLabel?: string
}>()

const router = useRouter()
const route = useRoute()

function goBack(fallback = '/campus') {
  if (import.meta.client && window.history.length > 1) {
    const ref = document.referrer
    const sameOrigin = ref && ref.startsWith(window.location.origin)
    if (sameOrigin) {
      router.back()
      return
    }
  }
  return navigateTo(fallback)
}
</script>

<template>
  <div class="legal-page">
    <SiteHeader />
    <main id="main-content" class="legal-page__main">
      <div class="legal-page__container">
        <button
          type="button"
          class="legal-back"
          @click="goBack(backTo || '/campus')"
        >
          ← {{ backLabel || 'Volver' }}
        </button>

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
          <NuxtLink
            v-for="item in [
              { to: '/nosotros', label: 'Nosotros' },
              { to: '/faq', label: 'FAQ' },
              { to: '/privacidad', label: 'Privacidad' },
              { to: '/terminos', label: 'Términos' },
              { to: '/cookies', label: 'Cookies' },
            ]"
            :key="item.to"
            :to="item.to"
            :class="{ 'is-current': route.path === item.to }"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </main>
  </div>
</template>
