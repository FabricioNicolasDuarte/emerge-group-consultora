<script setup lang="ts">
import { INSTITUTIONAL_NAV } from '~/data/legal-content'

const { brand } = useAppConfig()
const { public: { appVersion } } = useRuntimeConfig()
const { contact, emailHref, whatsappHref } = useAppContact()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer app-footer--subtle">
    <div class="app-footer__inner app-footer__inner--subtle">
      <p class="app-footer__line">
        © {{ year }} {{ brand.legalName }}
        <span class="app-footer__dot" aria-hidden="true">·</span>
        <span class="app-footer__muted" :title="`Campus Emerge v${appVersion}`">v{{ appVersion }}</span>
        <span class="app-footer__dot" aria-hidden="true">·</span>
        <a :href="emailHref" class="app-footer__quiet">{{ contact.email }}</a>
        <span class="app-footer__dot" aria-hidden="true">·</span>
        <a :href="whatsappHref" class="app-footer__quiet" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </p>
      <nav class="app-footer__links app-footer__links--subtle" aria-label="Información institucional">
        <NuxtLink v-for="item in INSTITUTIONAL_NAV" :key="item.to" :to="item.to">
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>
  </footer>
</template>
