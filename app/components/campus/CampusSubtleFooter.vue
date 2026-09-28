<script setup lang="ts">
import { INSTITUTIONAL_NAV } from '~/data/legal-content'

const { brand } = useAppConfig()
const { public: { appVersion } } = useRuntimeConfig()
const { openSupport } = useCampusSupport()

const year = new Date().getFullYear()

const chips = computed(() => [
  { id: 'copy', kind: 'text' as const, label: `© ${year} ${brand.legalName}` },
  ...INSTITUTIONAL_NAV.map((item) => ({
    id: item.to,
    kind: 'link' as const,
    label: item.label,
    to: item.to,
  })),
  { id: 'version', kind: 'text' as const, label: `v${appVersion}` },
  { id: 'support', kind: 'action' as const, label: 'Soporte técnico' },
])
</script>

<template>
  <footer class="campus-footbar" aria-label="Información y soporte">
    <div class="campus-footbar__rail">
      <template v-for="chip in chips" :key="chip.id">
        <NuxtLink
          v-if="chip.kind === 'link'"
          :to="chip.to"
          class="campus-footbar__chip"
        >
          {{ chip.label }}
        </NuxtLink>
        <button
          v-else-if="chip.kind === 'action'"
          type="button"
          class="campus-footbar__chip campus-footbar__chip--action"
          @click="openSupport()"
        >
          {{ chip.label }}
        </button>
        <span
          v-else
          class="campus-footbar__chip campus-footbar__chip--muted"
        >
          {{ chip.label }}
        </span>
      </template>
    </div>
  </footer>
</template>
