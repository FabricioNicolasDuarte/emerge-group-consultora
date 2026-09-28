<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<{
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

const isExternal = computed(() =>
  Boolean(props.to && /^https?:\/\//i.test(props.to)),
)

function onClick(event: MouseEvent) {
  event.stopPropagation()
  emit('click', event)
}
</script>

<template>
  <a
    v-if="to && isExternal"
    :href="to"
    class="campus-icon-btn"
    :class="{ 'campus-icon-btn--danger': danger }"
    :title="label"
    :aria-label="label"
    target="_blank"
    rel="noopener noreferrer"
    @click.stop
  >
    <Icon :icon="icon" width="18" height="18" aria-hidden="true" />
  </a>
  <NuxtLink
    v-else-if="to"
    :to="to"
    class="campus-icon-btn"
    :class="{ 'campus-icon-btn--danger': danger }"
    :title="label"
    :aria-label="label"
    @click.stop
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
    @click="onClick"
  >
    <Icon :icon="icon" width="18" height="18" aria-hidden="true" />
  </button>
</template>
