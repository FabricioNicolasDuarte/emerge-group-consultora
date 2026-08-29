<script setup lang="ts">
export type PublicNavItem = {
  id: string
  label: string
}

const props = withDefaults(defineProps<{
  homeTo: string
  nav: readonly PublicNavItem[]
  ctaTo: string
  ctaLabel: string
  ctaVariant?: 'action' | 'dark'
  secondaryTo?: string
  secondaryLabel?: string
  extraNav?: PublicNavItem[]
}>(), {
  ctaVariant: 'action',
})

const route = useRoute()
const menuOpen = ref(false)

const navItems = computed(() => [
  ...props.nav,
  ...(props.extraNav ?? []),
])

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

watch(() => route.fullPath, () => closeMenu())

watch(menuOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('keydown', onDocumentKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('keydown', onDocumentKeydown)
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <header class="public-header">
    <div class="public-container public-header__inner">
      <NuxtLink :to="homeTo" class="public-header__logo" @click="closeMenu">
        <BrandLogo variant="full" />
      </NuxtLink>

      <button
        type="button"
        class="public-header__toggle"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        aria-controls="public-nav"
        aria-label="Abrir o cerrar menú de navegación"
        @click="toggleMenu"
      >
        <span class="sr-only">{{ menuOpen ? 'Cerrar menú' : 'Abrir menú' }}</span>
        <span class="public-header__bar" />
        <span class="public-header__bar" />
      </button>

      <nav
        id="public-nav"
        class="public-header__nav"
        :class="{ 'is-open': menuOpen }"
        aria-label="Principal"
      >
        <a
          v-for="item in navItems"
          :key="item.id"
          :href="`#${item.id}`"
          @click="closeMenu"
        >
          {{ item.label }}
        </a>
        <NuxtLink
          v-if="secondaryTo && secondaryLabel"
          :to="secondaryTo"
          class="public-header__secondary"
          @click="closeMenu"
        >
          {{ secondaryLabel }}
        </NuxtLink>
        <NuxtLink
          :to="ctaTo"
          class="public-btn public-btn--sm public-header__cta"
          :class="ctaVariant === 'dark' ? 'public-header__cta--dark' : 'public-btn--action'"
          @click="closeMenu"
        >
          {{ ctaLabel }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
