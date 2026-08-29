<script setup lang="ts">
export type SegmentOption = {
  id: string
  label: string
}

const props = defineProps<{
  options: readonly SegmentOption[]
  modelValue: string
  variant?: 'light' | 'dark'
  fullWidth?: boolean
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const mappedOptions = computed(() =>
  props.options.map(o => ({ value: o.id, label: o.label })),
)
</script>

<template>
  <SegmentControl
    :model-value="modelValue"
    :options="mappedOptions"
    :variant="variant"
    :full-width="fullWidth"
    :aria-label="ariaLabel"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
