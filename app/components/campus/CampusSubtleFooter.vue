<script setup lang="ts">
import { INSTITUTIONAL_NAV } from '~/data/legal-content'

const { brand } = useAppConfig()
const { public: { appVersion } } = useRuntimeConfig()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="campus-subtle-footer" aria-label="Información legal">
    <p class="campus-subtle-footer__copy">
      © {{ year }} {{ brand.legalName }}
      <span aria-hidden="true">·</span>
      <span title="Versión del Campus">v{{ appVersion }}</span>
    </p>
    <nav class="campus-subtle-footer__nav">
      <NuxtLink v-for="item in INSTITUTIONAL_NAV" :key="item.to" :to="item.to">
        {{ item.label }}
      </NuxtLink>
    </nav>
  </footer>
</template>
