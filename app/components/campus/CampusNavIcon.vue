<script setup lang="ts">
import type { CampusIconKey } from '~/types/brand'

withDefaults(defineProps<{
  name: CampusIconKey
  cpNav?: boolean
}>(), {
  cpNav: false,
})

const { icon } = useAppBrand()
</script>

<template>
  <span
    class="campus-nav-icon"
    :class="{ 'cp-nav__icon': cpNav }"
    aria-hidden="true"
  >
    <img :src="icon(name)" alt="">
  </span>
</template>

<style scoped>
.campus-nav-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.campus-nav-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}
</style>
