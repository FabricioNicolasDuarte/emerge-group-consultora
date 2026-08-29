<script setup lang="ts">
import { Icon } from '@iconify/vue'

const router = useRouter()
const { logo, brand } = useAppBrand()
const { breadcrumbs, backTo, showBack, homePath } = useCampusTopBar()
const { displayName, initials, signOut } = useCampusAuth()

const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)

const mobileNav = inject<{ toggleMobileNav: () => void } | null>('campusMobileNav', null)

function goBack() {
  if (backTo.value) {
    router.push(backTo.value)
    return
  }
  if (import.meta.client && window.history.length > 1) {
    router.back()
  }
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

async function onSignOut() {
  closeMenu()
  await signOut()
}

onMounted(() => {
  const onDocClick = (event: MouseEvent) => {
    if (!menuRoot.value?.contains(event.target as Node)) {
      closeMenu()
    }
  }
  document.addEventListener('click', onDocClick)
  onUnmounted(() => document.removeEventListener('click', onDocClick))
})
</script>

<template>
  <header class="campus-topbar">
    <div class="campus-topbar__start">
      <button
        v-if="mobileNav"
        type="button"
        class="campus-topbar__menu"
        aria-label="Abrir menú"
        @click="mobileNav.toggleMobileNav()"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
        </svg>
      </button>

      <NuxtLink
        :to="homePath"
        class="campus-topbar__mark"
        :title="brand.name"
      >
        <img :src="logo('mark')" :alt="brand.shortName">
      </NuxtLink>

      <button
        v-if="showBack"
        type="button"
        class="campus-topbar__back"
        title="Volver"
        aria-label="Volver"
        @click="goBack"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
        </svg>
      </button>

      <nav class="campus-topbar__crumbs" aria-label="Ubicación en el campus">
        <ol>
          <li
            v-for="(crumb, index) in breadcrumbs"
            :key="`${crumb.label}-${index}`"
          >
            <span v-if="index > 0" class="campus-topbar__sep" aria-hidden="true">/</span>
            <NuxtLink
              v-if="crumb.to && index < breadcrumbs.length - 1"
              :to="crumb.to"
            >
              {{ crumb.label }}
            </NuxtLink>
            <span v-else class="campus-topbar__current">{{ crumb.label }}</span>
          </li>
        </ol>
      </nav>
    </div>

    <div class="campus-topbar__end">
      <div v-if="$slots.actions" class="campus-topbar__actions">
        <slot name="actions" />
      </div>

      <NuxtLink to="/campus/buzon" class="campus-topbar__icon-btn campus-topbar__bell" aria-label="Notificaciones y mensajes" title="Notificaciones y mensajes">
        <Icon icon="mdi:bell-outline" class="campus-topbar__bell-icon" aria-hidden="true" />
        <CampusMailboxBadge placement="inline" />
      </NuxtLink>

      <div ref="menuRoot" class="campus-topbar__user">
        <button
          type="button"
          class="campus-topbar__user-btn"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-haspopup="menu"
          aria-label="Menú de usuario"
          @click.stop="toggleMenu"
        >
          <span class="campus-topbar__avatar">{{ initials }}</span>
          <span class="campus-topbar__name">{{ displayName }}</span>
          <svg class="campus-topbar__chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        <div v-if="menuOpen" class="campus-topbar__menu" role="menu">
          <p class="campus-topbar__menu-label">{{ displayName }}</p>
          <NuxtLink
            :to="homePath"
            role="menuitem"
            @click="closeMenu"
          >
            Ir a mi panel
          </NuxtLink>
          <NuxtLink to="/campus" role="menuitem" @click="closeMenu">
            Portal Campus
          </NuxtLink>
          <button type="button" role="menuitem" @click="onSignOut">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.campus-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  min-height: 58px;
  padding: 0.65rem 1.25rem;
  border-bottom: 1px solid var(--campus-border-strong);
  background: var(--eg-surface);
  box-shadow: var(--campus-shadow-sm);
}

.campus-topbar__start,
.campus-topbar__end {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.campus-topbar__start {
  flex: 1;
}

.campus-topbar__menu {
  display: none;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--campus-border-strong);
  border-radius: 10px;
  background: var(--eg-surface);
  color: var(--eg-ink);
  cursor: pointer;
}

.campus-topbar__mark {
  display: none;
  flex-shrink: 0;
  line-height: 0;
}

.campus-topbar__mark img {
  width: 34px;
  height: 34px;
  display: block;
  object-fit: contain;
}

.campus-topbar__back {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(13, 44, 84, 0.12);
  border-radius: 10px;
  background: var(--eg-surface);
  color: var(--eg-ink-soft);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.campus-topbar__back svg {
  width: 18px;
  height: 18px;
}

.campus-topbar__back:hover {
  color: var(--campus-ink);
  border-color: rgba(37, 99, 235, 0.35);
  background: var(--eg-surface);
}

.campus-topbar__crumbs {
  min-width: 0;
}

.campus-topbar__crumbs ol {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.875rem;
  font-family: var(--campus-font-body, 'Montserrat', sans-serif);
}

.campus-topbar__crumbs a {
  color: var(--campus-primary);
  font-weight: 600;
  text-decoration: none;
}

.campus-topbar__crumbs a:hover {
  text-decoration: underline;
}

.campus-topbar__sep {
  color: rgba(13, 44, 84, 0.35);
  margin: 0 0.15rem;
}

.campus-topbar__current {
  color: var(--campus-ink);
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.campus-topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.campus-topbar__icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(13, 44, 84, 0.12);
  border-radius: 12px;
  background: var(--eg-row-bg);
  text-decoration: none;
  color: var(--campus-ink);
}

.campus-topbar__bell-icon {
  width: 20px;
  height: 20px;
  color: var(--campus-ink);
}

.campus-topbar__icon-btn:hover {
  border-color: rgba(37, 99, 235, 0.35);
  background: var(--eg-surface);
  box-shadow: var(--campus-shadow-sm);
}

.campus-topbar__user {
  position: relative;
}

.campus-topbar__user-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 220px;
  padding: 0.25rem 0.45rem 0.25rem 0.25rem;
  border: 1px solid rgba(13, 44, 84, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  font-family: inherit;
}

.campus-topbar__user-btn:hover {
  border-color: rgba(37, 99, 235, 0.28);
}

.campus-topbar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--campus-primary);
  color: var(--eg-surface);
  font-size: 0.78rem;
  font-weight: 800;
  flex-shrink: 0;
}

.campus-topbar__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--campus-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.campus-topbar__chevron {
  width: 18px;
  height: 18px;
  color: var(--eg-muted);
  flex-shrink: 0;
}

.campus-topbar__menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  min-width: 190px;
  padding: 0.35rem;
  border: 1px solid rgba(13, 44, 84, 0.1);
  border-radius: 12px;
  background: var(--eg-surface);
  box-shadow: var(--campus-shadow-md);
  z-index: 30;
}

.campus-topbar__menu-label {
  margin: 0;
  padding: 0.45rem 0.65rem 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--eg-muted);
}

.campus-topbar__menu a,
.campus-topbar__menu button {
  display: block;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--campus-ink);
  text-align: left;
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.campus-topbar__menu a:hover,
.campus-topbar__menu button:hover {
  background: var(--eg-info-bg);
}

.campus-topbar__menu button:last-child {
  color: var(--eg-accent);
}

@media (max-width: 991.98px) {
  .campus-topbar__menu {
    display: inline-flex;
  }

  .campus-topbar__mark {
    display: inline-flex;
  }

  .campus-topbar__name {
    display: none;
  }

  .campus-topbar__chevron {
    display: none;
  }
}

@media (max-width: 640px) {
  .campus-topbar {
    padding-inline: 0.85rem;
  }

  .campus-topbar__crumbs ol {
    flex-wrap: nowrap;
  }

  .campus-topbar__crumbs li:not(:last-child) {
    display: none;
  }

  .campus-topbar__sep {
    display: none;
  }
}
</style>
