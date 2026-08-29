<script setup lang="ts">
export type SegmentOption = {
  value: string
  label: string
  to?: string
}

const props = withDefaults(defineProps<{
  options: readonly SegmentOption[]
  modelValue: string
  variant?: 'light' | 'dark'
  fullWidth?: boolean
  ariaLabel?: string
}>(), {
  variant: 'light',
  ariaLabel: 'Opciones',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const root = ref<HTMLElement | null>(null)

function select(option: SegmentOption) {
  if (!option.to && option.value !== props.modelValue) {
    emit('update:modelValue', option.value)
  }
}

function focusOption(index: number) {
  if (!import.meta.client || !root.value) return
  const tabs = root.value.querySelectorAll<HTMLElement>('[role="tab"]')
  const target = tabs[index]
  if (target) target.focus()
}

function onKeydown(event: KeyboardEvent) {
  const currentIndex = props.options.findIndex(o => o.value === props.modelValue)
  if (currentIndex < 0) return

  let nextIndex = currentIndex

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    nextIndex = (currentIndex + 1) % props.options.length
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    nextIndex = (currentIndex - 1 + props.options.length) % props.options.length
  } else if (event.key === 'Home') {
    event.preventDefault()
    nextIndex = 0
  } else if (event.key === 'End') {
    event.preventDefault()
    nextIndex = props.options.length - 1
  } else {
    return
  }

  const option = props.options[nextIndex]
  if (!option) return

  if (!option.to) {
    emit('update:modelValue', option.value)
  }
  focusOption(nextIndex)
}
</script>

<template>
  <div
    ref="root"
    class="public-segment"
    :class="[
      variant === 'dark' ? 'public-segment--dark' : '',
      fullWidth ? 'public-segment--full' : '',
    ]"
    role="tablist"
    :aria-label="ariaLabel"
    @keydown="onKeydown"
  >
    <component
      :is="option.to ? 'NuxtLink' : 'button'"
      v-for="option in options"
      :key="option.value"
      :to="option.to"
      type="button"
      role="tab"
      class="public-segment__btn"
      :class="{ 'is-active': modelValue === option.value }"
      :aria-selected="modelValue === option.value ? 'true' : 'false'"
      :tabindex="modelValue === option.value ? 0 : -1"
      @click="select(option)"
    >
      {{ option.label }}
    </component>
  </div>
</template>
