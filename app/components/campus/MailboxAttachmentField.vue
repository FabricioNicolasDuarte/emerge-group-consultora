<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: File[]
  disabled?: boolean
  label?: string
}>(), {
  modelValue: () => [],
  label: 'Adjuntos',
})

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

const files = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function onSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files ?? [])
  if (!selected.length) return
  files.value = [...files.value, ...selected]
  input.value = ''
}

function removeFile(index: number) {
  files.value = files.value.filter((_, i) => i !== index)
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="attachment-field">
    <div class="field-head">
      <span>{{ label }}</span>
      <button type="button" :disabled="disabled" @click="fileInput?.click()">
        + Agregar archivo
      </button>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
        hidden
        @change="onSelected"
      >
    </div>

    <ul v-if="files.length" class="file-list">
      <li v-for="(file, index) in files" :key="`${file.name}-${index}`">
        <span>{{ file.name }} ({{ formatSize(file.size) }})</span>
        <button type="button" :disabled="disabled" @click="removeFile(index)">Quitar</button>
      </li>
    </ul>

    <p v-else class="hint">Podés adjuntar imágenes, videos, PDFs u otros documentos.</p>
  </div>
</template>

<style scoped>
.attachment-field {
  display: grid;
  gap: 10px;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 700;
  font-size: 14px;
}

.field-head button {
  border: 1px solid #dce3ed;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.file-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.file-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
}

.file-list button {
  border: none;
  background: none;
  color: #b42318;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.hint {
  margin: 0;
  color: #8390A2;
  font-size: 13px;
}
</style>
