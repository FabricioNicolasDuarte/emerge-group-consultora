<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>(), {
  label: '',
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    class="campus-switch"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label || (modelValue ? 'Activado' : 'Desactivado')"
    :disabled="disabled"
    @click="toggle"
  >
    <span class="campus-switch__track" :class="{ 'is-on': modelValue }">
      <span class="campus-switch__thumb" />
    </span>
    <span v-if="label" class="campus-switch__label">{{ label }}</span>
  </button>
</template>
