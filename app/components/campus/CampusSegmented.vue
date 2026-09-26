<script setup lang="ts">
export interface CampusSegmentOption {
  value: string
  label: string
  to?: string
}

const props = defineProps<{
  modelValue?: string
  options: CampusSegmentOption[]
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onUpdate(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <PublicSegmentControl
    :model-value="modelValue ?? ''"
    :options="options"
    :aria-label="ariaLabel"
    @update:model-value="onUpdate"
  />
</template>
