<script setup lang="ts">
import { INSTITUTIONAL_NAV } from '~/data/legal-content'

const { brand } = useAppConfig()
const { public: { appVersion } } = useRuntimeConfig()
const { contact, emailHref, whatsappHref } = useAppContact()

const year = new Date().getFullYear()

const chips = computed(() => [
  { id: 'copy', kind: 'text' as const, label: `© ${year} ${brand.legalName}` },
  ...INSTITUTIONAL_NAV.map((item) => ({
    id: item.to,
    kind: 'link' as const,
    label: item.label,
    to: item.to,
  })),
  { id: 'mail', kind: 'href' as const, label: 'Email', href: emailHref.value },
  { id: 'wa', kind: 'href' as const, label: 'WhatsApp', href: whatsappHref.value },
  { id: 'version', kind: 'text' as const, label: `v${appVersion}` },
])
</script>

<template>
  <footer class="app-footer app-footer--subtle">
    <div class="app-footer__rail">
      <template v-for="chip in chips" :key="chip.id">
        <NuxtLink
          v-if="chip.kind === 'link'"
          :to="chip.to"
          class="app-footer__chip"
        >
          {{ chip.label }}
        </NuxtLink>
        <a
          v-else-if="chip.kind === 'href'"
          :href="chip.href"
          class="app-footer__chip"
          :target="chip.id === 'wa' ? '_blank' : undefined"
          :rel="chip.id === 'wa' ? 'noopener noreferrer' : undefined"
        >
          {{ chip.label }}
        </a>
        <span
          v-else
          class="app-footer__chip app-footer__chip--muted"
        >
          {{ chip.label }}
        </span>
      </template>
    </div>
  </footer>
</template>
