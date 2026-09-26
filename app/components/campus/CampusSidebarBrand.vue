<script setup lang="ts">
const collapsed = inject<Ref<boolean>>('campusSidebarCollapsed', ref(false))
const { brand, logo } = useAppBrand()

const isWide = ref(true)

onMounted(() => {
  const media = window.matchMedia('(min-width: 992px)')
  const sync = () => {
    isWide.value = media.matches
  }
  sync()
  media.addEventListener('change', sync)
  onUnmounted(() => media.removeEventListener('change', sync))
})

const showCompactLogo = computed(() => collapsed.value && isWide.value)
</script>

<template>
  <NuxtLink to="/campus" class="cp-brand" :title="brand.name">
    <!-- Expandido: logo completo con texto sobre fondo claro (águila oscura legible) -->
    <img
      v-if="!showCompactLogo"
      :src="logo('fullWhiteBg')"
      :alt="brand.name"
      class="cp-brand__logo cp-brand__logo--full"
    >
    <!-- Colapsado: marca con fondo claro propio (no invertir: el águila es oscura) -->
    <img
      v-else
      :src="logo('mark')"
      alt=""
      class="cp-brand__logo cp-brand__logo--mark"
      aria-hidden="true"
    >
  </NuxtLink>
  <span v-if="!showCompactLogo" class="cp-campus-tag">CAMPUS</span>
</template>
