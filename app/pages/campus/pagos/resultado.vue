<script setup lang="ts">
definePageMeta({ layout: false })

usePublicSeo({
  title: 'Resultado del pago — Campus Emerge',
  description: 'Estado de tu pago en Campus Emerge.',
  noindex: true,
})

const route = useRoute()
const { homePath } = useCampusPanelHome()

const panelLink = computed(() => homePath.value)
const courseSlug = computed(() => String(route.query.slug || ''))
const courseLink = computed(() =>
  courseSlug.value ? `/campus/cursos/${courseSlug.value}` : null,
)

const status = computed(() => String(route.query.status || 'pending'))
const reference = computed(() => String(route.query.ref || ''))

const title = computed(() => {
  if (status.value === 'success') return '¡Pago confirmado!'
  if (status.value === 'failure') return 'Pago no completado'
  return 'Pago pendiente'
})

const message = computed(() => {
  if (status.value === 'success') {
    return 'Tu inscripción se activará en unos instantes. Ya podés acceder al contenido del curso.'
  }
  if (status.value === 'failure') {
    return 'El pago no se procesó. Podés intentar nuevamente desde la página del curso.'
  }
  return 'Mercado Pago está procesando tu pago. Te avisaremos cuando se confirme.'
})
</script>

<template>
  <div class="tx-page">
    <main id="main-content" class="tx-card" :class="status">
      <span class="tx-card__icon">
        {{ status === 'success' ? '✓' : status === 'failure' ? '✕' : '…' }}
      </span>
      <h1>{{ title }}</h1>
      <p>{{ message }}</p>
      <p v-if="reference" class="tx-card__ref">Referencia: {{ reference }}</p>
      <div class="tx-card__actions">
        <NuxtLink v-if="courseLink" :to="courseLink" class="public-btn public-btn--primary">
          Ir al curso
        </NuxtLink>
        <NuxtLink :to="panelLink" class="public-btn public-btn--outline">
          Ir a mi campus
        </NuxtLink>
        <NuxtLink to="/campus" class="public-btn public-btn--action">
          Ver programas
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
