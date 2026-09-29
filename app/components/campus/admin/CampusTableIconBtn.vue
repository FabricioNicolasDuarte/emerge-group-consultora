<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<{
  icon: string
  label: string
  to?: string
  danger?: boolean
  disabled?: boolean
  /** Show visible text next to the icon (better on mobile). */
  withLabel?: boolean
}>(), {
  danger: false,
  disabled: false,
  withLabel: false,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const isExternal = computed(() =>
  Boolean(props.to && /^https?:\/\//i.test(props.to)),
)

const btnClass = computed(() => ({
  'campus-icon-btn': true,
  'campus-icon-btn--danger': props.danger,
  'campus-icon-btn--labeled': props.withLabel,
}))

function onClick(event: MouseEvent) {
  event.stopPropagation()
  emit('click', event)
}
</script>

<template>
  <a
    v-if="to && isExternal"
    :href="to"
    :class="btnClass"
    :title="label"
    :aria-label="label"
    target="_blank"
    rel="noopener noreferrer"
    @click.stop
  >
    <Icon :icon="icon" width="18" height="18" aria-hidden="true" />
    <span v-if="withLabel" class="campus-icon-btn__text">{{ label }}</span>
  </a>
  <NuxtLink
    v-else-if="to"
    :to="to"
    :class="btnClass"
    :title="label"
    :aria-label="label"
    @click.stop
  >
    <Icon :icon="icon" width="18" height="18" aria-hidden="true" />
    <span v-if="withLabel" class="campus-icon-btn__text">{{ label }}</span>
  </NuxtLink>
  <button
    v-else
    type="button"
    :class="btnClass"
    :title="label"
    :aria-label="label"
    :disabled="disabled"
    @click="onClick"
  >
    <Icon :icon="icon" width="18" height="18" aria-hidden="true" />
    <span v-if="withLabel" class="campus-icon-btn__text">{{ label }}</span>
  </button>
</template>
