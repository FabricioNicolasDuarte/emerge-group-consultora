<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'

const props = withDefaults(defineProps<{
  modelValue?: string
  designJson?: Record<string, unknown> | null
  placeholder?: string
  minHeight?: string
}>(), {
  modelValue: '',
  placeholder: 'Escribí el contenido del anuncio…',
  minHeight: '320px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:designJson': [value: Record<string, unknown> | null]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')

const FONT_OPTIONS = [
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Cinzel', value: 'Cinzel, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
]

const ICON_OPTIONS = [
  'mdi:bell-ring', 'mdi:school', 'mdi:calendar-star', 'mdi:trophy',
  'mdi:lightbulb-on', 'mdi:account-group', 'mdi:book-open-page-variant',
  'mdi:rocket-launch', 'mdi:star', 'mdi:information',
]

const editor = useEditor({
  content: props.modelValue,
  immediatelyRender: false,
  extensions: [
    StarterKit,
    Underline,
    TextStyle,
    Color,
    FontFamily,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false }),
    Image.configure({ inline: false, allowBase64: false }),
    Youtube.configure({ width: 640, height: 360 }),
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  onUpdate: ({ editor: ed }) => {
    emit('update:modelValue', ed.getHTML())
    emit('update:designJson', ed.getJSON() as Record<string, unknown>)
  },
})

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value, false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function run(action: () => void) {
  action()
  editor.value?.commands.focus()
}

function setLink() {
  const previous = editor.value?.getAttributes('link').href as string | undefined
  const url = window.prompt('URL del enlace', previous ?? 'https://')
  if (url === null) return
  if (!url) {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function iconifyUrl(icon: string) {
  const [prefix, name] = icon.split(':')
  return `https://api.iconify.design/${prefix}/${name}.svg`
}

function insertIcon(icon: string) {
  const url = iconifyUrl(icon)
  editor.value?.chain().focus().insertContent(
    `<p><img src="${url}" alt="" class="announcement-icon" width="32" height="32" data-icon="${icon}" /></p>`,
  ).run()
}

function triggerMediaUpload() {
  fileInput.value?.click()
}

async function onMediaSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !editor.value) return
  uploadError.value = ''
  uploading.value = true
  try {
    const supabase = useSupabaseClient()
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `editor-uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('announcement-media')
      .upload(path, file, { upsert: false, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('announcement-media').getPublicUrl(path)
    const url = data.publicUrl
    if (file.type.startsWith('video/')) {
      editor.value.chain().focus().insertContent(
        `<video controls src="${url}" style="max-width:100%;border-radius:12px;"></video>`,
      ).run()
    } else {
      editor.value.chain().focus().setImage({ src: url, alt: file.name }).run()
    }
  } catch (error: unknown) {
    uploadError.value = error instanceof Error ? error.message : 'No se pudo subir el archivo'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="rich-editor">
    <div v-if="editor" class="toolbar">
      <div class="toolbar-group">
        <button type="button" title="Negrita" :class="{ active: editor.isActive('bold') }" @click="run(() => editor!.chain().focus().toggleBold().run())">B</button>
        <button type="button" title="Cursiva" :class="{ active: editor.isActive('italic') }" @click="run(() => editor!.chain().focus().toggleItalic().run())"><em>I</em></button>
        <button type="button" title="Subrayado" :class="{ active: editor.isActive('underline') }" @click="run(() => editor!.chain().focus().toggleUnderline().run())"><u>U</u></button>
      </div>
      <div class="toolbar-group">
        <button type="button" :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="run(() => editor!.chain().focus().toggleHeading({ level: 1 }).run())">H1</button>
        <button type="button" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="run(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())">H2</button>
        <button type="button" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="run(() => editor!.chain().focus().toggleHeading({ level: 3 }).run())">H3</button>
      </div>
      <div class="toolbar-group">
        <button type="button" @click="run(() => editor!.chain().focus().setTextAlign('left').run())">⬅</button>
        <button type="button" @click="run(() => editor!.chain().focus().setTextAlign('center').run())">↔</button>
        <button type="button" @click="run(() => editor!.chain().focus().setTextAlign('right').run())">➡</button>
      </div>
      <div class="toolbar-group">
        <button type="button" @click="run(() => editor!.chain().focus().toggleBulletList().run())">• Lista</button>
        <button type="button" @click="run(() => editor!.chain().focus().toggleOrderedList().run())">1. Lista</button>
        <button type="button" @click="run(() => editor!.chain().focus().toggleBlockquote().run())">❝</button>
      </div>
      <div class="toolbar-group">
        <select @change="(e) => run(() => editor!.chain().focus().setFontFamily((e.target as HTMLSelectElement).value).run())">
          <option value="">Fuente</option>
          <option v-for="font in FONT_OPTIONS" :key="font.value" :value="font.value">{{ font.label }}</option>
        </select>
        <input type="color" title="Color de texto" @input="(e) => run(() => editor!.chain().focus().setColor((e.target as HTMLInputElement).value).run())">
        <button type="button" @click="setLink">🔗</button>
      </div>
      <div class="toolbar-group icons">
        <button
          v-for="icon in ICON_OPTIONS"
          :key="icon"
          type="button"
          class="icon-btn"
          :title="icon"
          @click="insertIcon(icon)"
        >
          <Icon :icon="icon" width="18" />
        </button>
      </div>
      <div class="toolbar-group">
        <button type="button" class="media-btn" :disabled="uploading" @click="triggerMediaUpload">
          {{ uploading ? 'Subiendo…' : '📎 Imagen / Video' }}
        </button>
        <input ref="fileInput" type="file" accept="image/*,video/*" hidden @change="onMediaSelected">
      </div>
    </div>

    <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
    <EditorContent :editor="editor" class="editor-surface" :style="{ minHeight }" />
  </div>
</template>

<style scoped>
.rich-editor {
  border: 1px solid var(--eg-field-border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--eg-surface);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid var(--eg-row-border);
  background: var(--eg-row-bg);
}

.toolbar-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.toolbar-group.icons {
  max-width: 100%;
}

.toolbar button,
.media-btn {
  border: 1px solid var(--eg-field-border);
  background: var(--eg-surface);
  color: var(--eg-ink);
  padding: 6px 10px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
}

.toolbar button.active {
  background: var(--eg-ink);
  color: var(--eg-surface);
  border-color: var(--eg-ink);
}

.toolbar select,
.toolbar input[type="color"] {
  border: 1px solid var(--eg-field-border);
  border-radius: 8px;
  padding: 4px;
  font-family: inherit;
  font-size: 12px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
}

.media-btn {
  background: var(--eg-accent);
  border-color: var(--eg-accent);
  color: var(--eg-surface);
}

.upload-error {
  color: var(--eg-error);
  font-size: 13px;
  padding: 8px 12px;
  margin: 0;
}

.editor-surface :deep(.tiptap) {
  padding: 20px;
  min-height: inherit;
  outline: none;
  font-family: var(--eg-font-body);
  line-height: 1.7;
  color: var(--eg-ink);
}

.editor-surface :deep(.tiptap p.is-editor-empty:first-child::before) {
  color: var(--eg-subtle);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-surface :deep(.tiptap img),
.editor-surface :deep(.tiptap video) {
  max-width: 100%;
  border-radius: 12px;
  margin: 12px 0;
}

.editor-surface :deep(.announcement-icon) {
  display: inline-flex;
  font-size: 12px;
  color: var(--eg-subtle);
}
</style>
