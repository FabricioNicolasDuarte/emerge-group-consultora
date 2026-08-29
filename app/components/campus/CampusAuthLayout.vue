<script setup lang="ts">
import '~/assets/css/auth.css'

defineProps<{
  kicker?: string
  backTo?: string
  backLabel?: string
}>()
</script>

<template>
  <div class="auth-page">
    <div class="auth-layout">
      <section class="auth-brand">
        <NuxtLink v-if="backTo" :to="backTo" class="auth-brand__logo">
          <BrandLogo variant="fullVertical" />
        </NuxtLink>
        <slot name="brand" />
      </section>
      <section class="auth-form-side">
        <main id="main-content" class="auth-card">
          <slot />
        </main>
      </section>
    </div>
  </div>
</template>
