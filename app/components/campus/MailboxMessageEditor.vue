<script setup lang="ts">
import { plainTextToHtml, stripHtml } from '~/utils/sanitize-html'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  minHeight?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  placeholder: 'Escribí tu mensaje…',
  minHeight: '200px',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const plain = ref(stripHtml(props.modelValue))

watch(() => props.modelValue, (value) => {
  const next = stripHtml(value)
  if (next !== plain.value) plain.value = next
})

watch(plain, (value) => {
  emit('update:modelValue', plainTextToHtml(value))
})
</script>

<template>
  <textarea
    v-model="plain"
    class="mailbox-message-editor"
    :placeholder="placeholder"
    :disabled="disabled"
    :style="{ minHeight }"
    rows="8"
  />
</template>

<style scoped>
.mailbox-message-editor {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--eg-field-border);
  border-radius: 10px;
  font-family: var(--eg-font-body);
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  color: var(--eg-ink);
  background: var(--eg-surface);
}

.mailbox-message-editor:focus {
  outline: none;
  border-color: var(--eg-action);
  box-shadow: 0 0 0 3px var(--eg-info-bg);
}

.mailbox-message-editor:disabled {
  background: var(--eg-row-bg);
  color: var(--eg-subtle);
}
</style>
