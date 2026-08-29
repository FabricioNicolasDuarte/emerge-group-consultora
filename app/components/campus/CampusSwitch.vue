<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const id = useId()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label class="campus-switch" :class="{ 'is-disabled': disabled }" :for="id">
    <span v-if="label" class="campus-switch__label">{{ label }}</span>
    <button
      :id="id"
      type="button"
      class="campus-switch__track"
      role="switch"
      :aria-checked="modelValue ? 'true' : 'false'"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="campus-switch__thumb" />
    </button>
  </label>
</template>

<style scoped>
.campus-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
}

.campus-switch.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.campus-switch__label {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--campus-ink, #0D2C54);
}

.campus-switch__track {
  position: relative;
  width: 42px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--campus-radius-pill, 999px);
  background: #c9d4e3;
  cursor: pointer;
  transition: background 0.2s var(--campus-ease, ease);
}

.campus-switch__track[aria-checked='true'] {
  background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
}

.campus-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(13, 44, 84, 0.2);
  transition: transform 0.2s var(--campus-ease, ease);
}

.campus-switch__track[aria-checked='true'] .campus-switch__thumb {
  transform: translateX(18px);
}
</style>
