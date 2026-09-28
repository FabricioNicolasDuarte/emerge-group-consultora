<script setup lang="ts">
import { INSTITUTIONAL_NAV } from '~/data/legal-content'

const { brand } = useAppConfig()
const { public: { appVersion } } = useRuntimeConfig()
const { contact, emailHref, whatsappHref } = useAppContact()
const { links: socialLinks, hasLinks } = useAppSocial()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <NuxtLink to="/" class="app-footer__brand" :title="brand.name">
        <img
          :src="brand.logos.mark"
          :alt="brand.shortName"
          class="app-footer__logo"
          width="32"
          height="32"
        >
        <span class="app-footer__name">{{ brand.shortName }}</span>
      </NuxtLink>

      <div class="app-footer__center">
        <p class="app-footer__legal">
          © {{ year }} {{ brand.legalName }}. Todos los derechos reservados.
        </p>

        <nav class="app-footer__links" aria-label="Información institucional">
          <NuxtLink v-for="item in INSTITUTIONAL_NAV" :key="item.to" :to="item.to">
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="app-footer__contact">
          <a :href="emailHref">{{ contact.email }}</a>
          <span class="app-footer__sep" aria-hidden="true">·</span>
          <a :href="whatsappHref" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>

        <nav v-if="hasLinks" class="app-footer__social" aria-label="Redes sociales">
          <a
            v-for="item in socialLinks"
            :key="item.id"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="item.label"
          >
            {{ item.label }}
          </a>
        </nav>
      </div>

      <p class="app-footer__version" :title="`Campus Emerge · versión ${appVersion}`">
        Campus v{{ appVersion }}
      </p>
    </div>
  </footer>
</template>
