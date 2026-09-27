<script setup lang="ts">
import { Icon } from '@iconify/vue'

withDefaults(defineProps<{
  icon: string
  label: string
  to?: string
  danger?: boolean
  disabled?: boolean
}>(), {
  danger: false,
  disabled: false,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="campus-icon-btn"
    :class="{ 'campus-icon-btn--danger': danger }"
    :title="label"
    :aria-label="label"
  >
    <Icon :icon="icon" width="18" height="18" aria-hidden="true" />
  </NuxtLink>
  <button
    v-else
    type="button"
    class="campus-icon-btn"
    :class="{ 'campus-icon-btn--danger': danger }"
    :title="label"
    :aria-label="label"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <Icon :icon="icon" width="18" height="18" aria-hidden="true" />
  </button>
</template>
