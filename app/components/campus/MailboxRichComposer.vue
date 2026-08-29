<script setup lang="ts">
import { sanitizeHtml, stripHtml } from '~/utils/sanitize-html'

const props = withDefaults(defineProps<{
  modelValue?: string
  headerHtml?: string
  footerHtml?: string
  placeholder?: string
  minHeight?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  headerHtml: '',
  footerHtml: '',
  placeholder: 'Escribí tu mensaje…',
  minHeight: '280px',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:headerHtml': [value: string]
  'update:footerHtml': [value: string]
}>()

const body = ref(props.modelValue)
const header = ref(props.headerHtml)
const footer = ref(props.footerHtml)
const showHeader = ref(Boolean(stripHtml(props.headerHtml)))
const showFooter = ref(Boolean(stripHtml(props.footerHtml)))

watch(() => props.modelValue, (value) => {
  if (value !== body.value) body.value = value
})
watch(() => props.headerHtml, (value) => {
  if (value !== header.value) header.value = value
})
watch(() => props.footerHtml, (value) => {
  if (value !== footer.value) footer.value = value
})

watch(body, (value) => emit('update:modelValue', value))
watch(header, (value) => emit('update:headerHtml', value))
watch(footer, (value) => emit('update:footerHtml', value))
</script>

<template>
  <div class="mailbox-rich-composer">
    <div class="composer-section">
      <div class="section-head">
        <label>Encabezado personalizado</label>
        <button type="button" class="toggle" @click="showHeader = !showHeader">
          {{ showHeader ? 'Ocultar' : 'Agregar' }}
        </button>
      </div>
      <ClientOnly v-if="showHeader">
        <CampusRichTextEditor
          v-model="header"
          placeholder="Título, logo o introducción del mensaje…"
          min-height="120px"
        />
      </ClientOnly>
    </div>

    <div class="composer-section main">
      <label>Mensaje</label>
      <ClientOnly>
        <CampusRichTextEditor
          v-model="body"
          :placeholder="placeholder"
          :min-height="minHeight"
        />
        <template #fallback>
          <textarea
            v-model="body"
            class="fallback-editor"
            :placeholder="placeholder"
            :disabled="disabled"
            rows="10"
          />
        </template>
      </ClientOnly>
    </div>

    <div class="composer-section">
      <div class="section-head">
        <label>Pie de página</label>
        <button type="button" class="toggle" @click="showFooter = !showFooter">
          {{ showFooter ? 'Ocultar' : 'Agregar' }}
        </button>
      </div>
      <ClientOnly v-if="showFooter">
        <CampusRichTextEditor
          v-model="footer"
          placeholder="Firma, contacto o nota al pie…"
          min-height="100px"
        />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.mailbox-rich-composer {
  display: grid;
  gap: 20px;
}

.composer-section {
  display: grid;
  gap: 8px;
}

.composer-section label {
  font-weight: 700;
  font-size: 14px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.toggle {
  border: none;
  background: none;
  color: var(--eg-action);
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
}

.fallback-editor {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--eg-field-border);
  border-radius: 10px;
  font-family: var(--eg-font-body);
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  color: var(--eg-ink);
}
</style>
