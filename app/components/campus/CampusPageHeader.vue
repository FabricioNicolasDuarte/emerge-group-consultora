<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title?: string
  description?: string
  anchorId?: string
}>()
</script>

<template>
  <header class="campus-page-header" :id="anchorId">
    <div>
      <span v-if="eyebrow" class="campus-eyebrow">{{ eyebrow }}</span>
      <h1>
        <slot name="title">{{ title }}</slot>
      </h1>
      <p v-if="description || $slots.description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="campus-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>
