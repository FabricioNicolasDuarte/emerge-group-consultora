<script setup lang="ts">
const props = withDefaults(defineProps<{
  storageKey?: string
}>(), {
  storageKey: 'campus.sidebarCollapsed',
})

const collapsed = ref(false)
const mobileOpen = ref(false)
const collapseBtn = ref<HTMLButtonElement | null>(null)

const isDesktop = () =>
  import.meta.client && window.matchMedia('(min-width: 992px)').matches

function updateCollapseAria() {
  if (!collapseBtn.value) return
  const expanded = !collapsed.value
  collapseBtn.value.setAttribute('aria-expanded', expanded ? 'true' : 'false')
  collapseBtn.value.setAttribute(
    'aria-label',
    expanded ? 'Contraer menú' : 'Expandir menú',
  )
  collapseBtn.value.title = expanded ? 'Contraer menú' : 'Expandir menú'
}

function setCollapsed(value: boolean, persist = true) {
  collapsed.value = value
  if (persist && import.meta.client && isDesktop()) {
    localStorage.setItem(props.storageKey, value ? '1' : '0')
  }
  updateCollapseAria()
}

function toggleCollapsed() {
  if (!isDesktop()) return
  setCollapsed(!collapsed.value)
}

onMounted(() => {
  if (import.meta.client && isDesktop()) {
    collapsed.value = localStorage.getItem(props.storageKey) === '1'
  }
  updateCollapseAria()
})

function toggleMobileNav() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobileNav() {
  mobileOpen.value = false
}

const route = useRoute()
watch(() => route.fullPath, () => closeMobileNav())

provide('campusSidebarCollapsed', collapsed)
provide('campusMobileNav', { mobileOpen, toggleMobileNav, closeMobileNav })
</script>

<template>
  <div class="cp-app" :class="{ 'sidebar-collapsed': collapsed, 'mobile-nav-open': mobileOpen }">
    <div
      v-if="mobileOpen"
      class="cp-mobile-backdrop"
      aria-hidden="true"
      @click="closeMobileNav"
    />
    <aside id="campusAppSidebar" class="cp-sidebar">
      <slot name="brand" />

      <nav class="cp-nav" aria-label="Menú del panel">
        <slot name="nav" />
      </nav>

      <div v-if="$slots.footer" class="cp-sidebar-foot">
        <slot name="footer" />
      </div>

      <button
        ref="collapseBtn"
        type="button"
        class="cp-collapse-btn"
        aria-controls="campusAppSidebar"
        aria-expanded="true"
        title="Contraer menú"
        aria-label="Contraer menú"
        @click="toggleCollapsed"
      >
        <svg class="cp-collapse-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
          />
        </svg>
      </button>
    </aside>

    <div class="cp-main">
      <CampusTopBar>
        <template v-if="$slots['topbar-actions']" #actions>
          <slot name="topbar-actions" />
        </template>
      </CampusTopBar>
      <div class="cp-main__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cp-app {
  --cp-sidebar-w: 248px;
  --cp-sidebar-w-collapsed: 80px;
  --cp-ease-shell: cubic-bezier(0.22, 1, 0.36, 1);
  min-height: 100vh;
  width: 100%;
  display: grid;
  grid-template-columns: var(--cp-sidebar-w) minmax(0, 1fr);
  transition: grid-template-columns 0.3s var(--cp-ease-shell);
  overflow: visible;
  font-family: var(--campus-font-body, 'Montserrat', sans-serif);
  background: var(--campus-surface);
  color: var(--eg-ink);
}

.cp-app.sidebar-collapsed {
  grid-template-columns: var(--cp-sidebar-w-collapsed) minmax(0, 1fr);
}

.cp-sidebar {
  position: sticky;
  top: 0;
  z-index: 25;
  align-self: start;
  height: 100vh;
  max-height: 100vh;
  margin: 0;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0.6rem 0.75rem;
  border-radius: 0;
  box-shadow: 4px 0 24px rgba(13, 44, 84, 0.12);
  color: var(--eg-sidebar-text);
  background:
    radial-gradient(ellipse 80% 40% at 0% 0%, rgba(37, 99, 235, 0.22), transparent 55%),
    linear-gradient(180deg, var(--eg-ink) 0%, var(--eg-ink-mid) 100%);
}

.cp-nav {
  display: flex;
  flex-direction: column;
  gap: 0.04rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.cp-sidebar-foot {
  flex-shrink: 0;
  padding-top: 0.45rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.cp-collapse-btn {
  position: absolute;
  top: 50%;
  right: -14px;
  z-index: 30;
  transform: translateY(-50%);
  width: 24px;
  height: 44px;
  margin: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(160deg, var(--eg-accent) 0%, var(--eg-action) 100%);
  color: var(--eg-surface);
  box-shadow: 0 6px 18px rgba(242, 140, 40, 0.35);
  cursor: pointer;
  transition: filter 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.cp-collapse-btn:hover {
  filter: brightness(1.06);
  box-shadow: 0 8px 22px rgba(37, 99, 235, 0.38);
}

.cp-collapse-btn__icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s var(--cp-ease-shell);
}

.cp-app.sidebar-collapsed .cp-collapse-btn__icon {
  transform: rotate(180deg);
}

.cp-main {
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--campus-surface);
}

.cp-main__body {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 991.98px) {
  .cp-app,
  .cp-app.sidebar-collapsed {
    grid-template-columns: 1fr;
  }

  .cp-mobile-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(10, 35, 66, 0.45);
    backdrop-filter: blur(2px);
  }

  .cp-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    width: min(280px, 88vw);
    height: 100vh;
    max-height: 100vh;
    transform: translateX(-105%);
    transition: transform 0.28s var(--cp-ease-shell);
    box-shadow: 8px 0 32px rgba(13, 44, 84, 0.2);
  }

  .cp-app.mobile-nav-open .cp-sidebar {
    transform: translateX(0);
  }

  .cp-collapse-btn {
    display: none;
  }
}
</style>

<style>
/* Nav slots — unscoped so parent markup can use cp-nav__* classes */
.cp-nav__label {
  margin: 0.18rem 0.45rem 0.12rem;
  font-size: 0.6rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  opacity: 0.48;
  font-weight: 700;
  line-height: 1.2;
}

.cp-nav__divider {
  width: calc(100% - 0.9rem);
  height: 1px;
  margin: 0.18rem 0.45rem;
  background: linear-gradient(
    90deg,
    rgba(242, 140, 40, 0.65),
    rgba(37, 99, 235, 0.3) 45%,
    transparent
  );
}

.cp-nav a,
.cp-sidebar-foot a,
.cp-sidebar-foot button {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.48rem 0.6rem;
  border-radius: var(--campus-radius-sm, 10px);
  color: rgba(232, 241, 242, 0.9);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.84rem;
  line-height: 1.2;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.cp-nav a:hover,
.cp-sidebar-foot a:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--eg-surface);
}

.cp-nav a.router-link-active {
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.45), rgba(242, 140, 40, 0.16));
  color: var(--eg-surface);
  box-shadow: inset 2px 0 0 var(--eg-accent);
}

.cp-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.65rem 0.45rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  min-height: auto;
  flex-shrink: 0;
  background: transparent;
}

.cp-brand__logo {
  display: block;
  object-fit: contain;
}

.cp-brand__logo--mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fff;
  padding: 2px;
  box-sizing: border-box;
}

.cp-brand__logo--full {
  width: 100%;
  max-width: 168px;
  height: auto;
  max-height: 52px;
  border-radius: 10px;
  background: #fff;
  padding: 0.35rem 0.45rem;
  box-sizing: border-box;
}

.cp-campus-tag {
  display: block;
  text-align: center;
  color: var(--eg-accent);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0.15rem 0 0.15rem;
  flex-shrink: 0;
}

.cp-sidebar-foot .logout {
  color: var(--eg-accent);
  font-weight: 700;
  text-align: left;
}

.cp-nav__icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(232, 241, 242, 0.92);
}

.cp-nav__icon svg {
  width: 16px;
  height: 16px;
  display: block;
}

.cp-app.sidebar-collapsed .cp-nav__label {
  text-align: center;
  margin-inline: 0;
  letter-spacing: 0;
  font-size: 0;
}

.cp-app.sidebar-collapsed .cp-nav__label::after {
  content: "·";
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.32);
}

.cp-app.sidebar-collapsed .cp-nav a span:not(.cp-nav__icon):not(.campus-nav-icon),
.cp-app.sidebar-collapsed .cp-sidebar-foot a span:not(.cp-nav__icon):not(.campus-nav-icon),
.cp-app.sidebar-collapsed .cp-sidebar-foot button span:not(.cp-nav__icon):not(.campus-nav-icon) {
  display: none;
}

.cp-app.sidebar-collapsed .cp-nav__divider {
  width: 28px;
  margin: 0.35rem auto 0.4rem;
  background: linear-gradient(90deg, transparent, rgba(242, 140, 40, 0.75), transparent);
}

.cp-app.sidebar-collapsed .cp-brand {
  justify-content: center;
  padding-inline: 0;
}

.cp-app.sidebar-collapsed .cp-campus-tag {
  display: none;
}

.cp-app.sidebar-collapsed .cp-nav a,
.cp-app.sidebar-collapsed .cp-sidebar-foot a,
.cp-app.sidebar-collapsed .cp-sidebar-foot button {
  justify-content: center;
  padding-inline: 0.5rem;
}

@media (max-width: 991.98px) {
  .cp-app.sidebar-collapsed .cp-nav__label {
    text-align: left;
    margin: 0.35rem 0.55rem 0.45rem;
    letter-spacing: 0.12em;
    font-size: 0.68rem;
  }

  .cp-app.sidebar-collapsed .cp-nav__label::after {
    content: none;
  }

  .cp-app.sidebar-collapsed .cp-nav a span:not(.cp-nav__icon):not(.campus-nav-icon),
  .cp-app.sidebar-collapsed .cp-sidebar-foot a span:not(.cp-nav__icon):not(.campus-nav-icon),
  .cp-app.sidebar-collapsed .cp-sidebar-foot button span:not(.cp-nav__icon):not(.campus-nav-icon) {
    display: inline;
  }

  .cp-app.sidebar-collapsed .cp-nav__divider {
    width: calc(100% - 1.1rem);
    margin: 0.35rem 0.55rem 0.4rem;
    background: linear-gradient(
      90deg,
      rgba(242, 140, 40, 0.7),
      rgba(37, 99, 235, 0.35) 40%,
      rgba(255, 255, 255, 0.08) 85%,
      transparent
    );
  }

  .cp-app.sidebar-collapsed .cp-brand {
    justify-content: center;
    padding-inline: 0;
  }

  .cp-app.sidebar-collapsed .cp-campus-tag {
    display: block;
  }

  .cp-app.sidebar-collapsed .cp-nav a,
  .cp-app.sidebar-collapsed .cp-sidebar-foot a,
  .cp-app.sidebar-collapsed .cp-sidebar-foot button {
    justify-content: flex-start;
    padding-inline: 0.75rem;
  }
}
</style>
