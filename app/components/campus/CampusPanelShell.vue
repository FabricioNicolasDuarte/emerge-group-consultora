<script setup lang="ts">
import type { CampusPanelRole } from '~/composables/useCampusPanelNav'

const props = defineProps<{
  role: CampusPanelRole
}>()

const { groups, storageKey, signOut, isActive } = useCampusPanelNav(() => props.role)

const mobileNav = inject<{ closeMobileNav: () => void } | null>('campusMobileNav', null)

function onNavClick() {
  mobileNav?.closeMobileNav()
}
</script>

<template>
  <CampusCollapsibleSidebar :storage-key="storageKey">
    <template #brand>
      <CampusSidebarBrand />
    </template>

    <template #nav>
      <template v-for="(group, groupIndex) in groups" :key="group.label">
        <p class="cp-nav__label">{{ group.label }}</p>
        <NuxtLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          :title="item.label"
          :class="{ 'router-link-active': isActive(item) }"
          @click="onNavClick"
        >
          <CampusNavIcon :name="item.icon" cp-nav />
          <span>{{ item.label }}</span>
          <CampusMailboxBadge v-if="item.badge" />
        </NuxtLink>
        <div
          v-if="groupIndex < groups.length - 1"
          class="cp-nav__divider"
          aria-hidden="true"
        />
      </template>
    </template>

    <template #footer>
      <button type="button" class="logout" title="Cerrar sesión" @click="signOut">
        <span class="cp-nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </span>
        <span>Cerrar sesión</span>
      </button>
    </template>

    <slot />
  </CampusCollapsibleSidebar>
</template>
