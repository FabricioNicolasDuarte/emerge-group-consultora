<script setup lang="ts">
import type { BrandLogoVariant } from '~/types/brand'

const props = withDefaults(defineProps<{
  variant?: BrandLogoVariant
  alt?: string
  decorative?: boolean
}>(), {
  variant: 'full',
  decorative: false,
})

const { brand, logo } = useAppBrand()

const altText = computed(() => {
  if (props.decorative) return ''
  if (props.alt !== undefined) return props.alt
  return brand.name
})
</script>

<template>
  <img
    :src="logo(variant)"
    :alt="altText"
    class="brand-logo"
    :class="`brand-logo--${variant}`"
    :aria-hidden="decorative ? 'true' : undefined"
  >
</template>

<style scoped>
.brand-logo {
  display: block;
  max-width: 100%;
  height: auto;
}

.brand-logo--full,
.brand-logo--fullWhiteBg {
  height: 48px;
  width: auto;
}

.brand-logo--fullVertical {
  height: 56px;
  width: auto;
}

.brand-logo--mark,
.brand-logo--markOnDark {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
</style>
