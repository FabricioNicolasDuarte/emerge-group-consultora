<script setup lang="ts">
import type { AdminAnnouncement, AnnouncementLayoutStyle } from '~/types/comms'
import { AUDIENCE_LABELS, LAYOUT_LABELS } from '~/types/comms'
import { stripHtml } from '~/utils/sanitize-html'
import { formatSupabaseError } from '~/utils/supabase-error'

const props = defineProps<{
  announcementId?: string | null
}>()

const emit = defineEmits<{
  saved: [id: string]
}>()

const router = useRouter()
const { anuncioEditarPath } = useCampusStaffPaths()
const persistedId = ref<string | null>(props.announcementId ?? null)

watch(
  () => props.announcementId,
  (id) => {
    if (id) persistedId.value = id
  },
  { immediate: true },
)

const canUploadMedia = computed(() => Boolean(persistedId.value))

const { fetchAdminCourses } = useAcademic()
const {
  createAnnouncement,
  updateAnnouncement,
  fetchAnnouncementById,
  uploadAnnouncementMedia,
  deleteAnnouncementMedia,
  getAnnouncementMediaUrl,
} = useCampusComms()

const courses = ref<{ id: string, title: string }[]>([])
const loading = ref(Boolean(props.announcementId))
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

function buildPayload() {
  return {
    title: form.title,
    body_html: form.body_html,
    design_json: form.design_json,
    excerpt: form.excerpt || stripHtml(form.body_html).slice(0, 280),
    audience: form.audience,
    course_id: form.course_id || null,
    status: form.status,
    is_pinned: form.is_pinned,
    expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    background_color: form.background_color,
    accent_color: form.accent_color,
    layout_style: form.layout_style,
    cover_image_path: form.cover_image_path,
  }
}

async function ensurePersistedAnnouncement(): Promise<string | null> {
  if (persistedId.value) return persistedId.value

  if (!form.title.trim()) {
    errorMessage.value = 'Ingresá un título antes de subir archivos.'
    return null
  }

  saving.value = true
  errorMessage.value = ''
  try {
    const created = await createAnnouncement(buildPayload())
    persistedId.value = created.id
    emit('saved', created.id)
    successMessage.value = 'Borrador guardado. Ya podés subir archivos.'
    return created.id
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo guardar el borrador')
    return null
  } finally {
    saving.value = false
  }
}

async function openCoverPicker() {
  if (saving.value) return
  const id = await ensurePersistedAnnouncement()
  if (!id) return
  await nextTick()
  coverInput.value?.click()
}

async function openMediaPicker() {
  if (saving.value) return
  const id = await ensurePersistedAnnouncement()
  if (!id) return
  await nextTick()
  mediaInput.value?.click()
}

const { colors } = useAppConfig()

const form = reactive({
  title: '',
  body_html: '',
  design_json: null as Record<string, unknown> | null,
  excerpt: '',
  audience: 'all' as 'all' | 'students' | 'teachers' | 'course',
  course_id: '',
  status: 'draft' as 'draft' | 'published' | 'archived',
  is_pinned: false,
  expires_at: '',
  background_color: colors.surface,
  accent_color: colors.ink,
  layout_style: 'card' as AnnouncementLayoutStyle,
  cover_image_path: '' as string | null,
})

const media = ref<AdminAnnouncement['media']>([])
const coverInput = ref<HTMLInputElement | null>(null)
const mediaInput = ref<HTMLInputElement | null>(null)

async function loadAnnouncement() {
  if (!props.announcementId) return
  loading.value = true
  try {
    const row = await fetchAnnouncementById(props.announcementId)
    if (!row) {
      errorMessage.value = 'Anuncio no encontrado.'
      return
    }
    form.title = row.title
    form.body_html = row.body_html || row.body || ''
    form.design_json = row.design_json ?? null
    form.excerpt = row.excerpt || ''
    form.audience = row.audience
    form.course_id = row.course_id || ''
    form.status = row.status
    form.is_pinned = row.is_pinned
    form.expires_at = row.expires_at ? row.expires_at.slice(0, 16) : ''
    form.background_color = row.background_color || colors.surface
    form.accent_color = row.accent_color || colors.ink
    form.layout_style = (row.layout_style as AnnouncementLayoutStyle) || 'card'
    form.cover_image_path = row.cover_image_path
    media.value = row.media ?? []
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'Error al cargar anuncio')
  } finally {
    loading.value = false
  }
}

async function loadCourses() {
  const rows = await fetchAdminCourses()
  courses.value = rows.map((c) => ({ id: c.id, title: c.title }))
}

async function onSave() {
  if (!form.title.trim()) {
    errorMessage.value = 'Ingresá un título para el anuncio.'
    return
  }
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  const payload = buildPayload()
  try {
    if (persistedId.value) {
      await updateAnnouncement({ id: persistedId.value, ...payload })
      successMessage.value = form.status === 'published'
        ? 'Anuncio publicado. Ya es visible para la audiencia.'
        : 'Borrador guardado. Todavía no es visible para alumnos.'
      emit('saved', persistedId.value)
    } else {
      const created = await createAnnouncement(payload)
      persistedId.value = created.id
      successMessage.value = form.status === 'published'
        ? 'Anuncio creado y publicado.'
        : 'Borrador creado. Publicá cuando esté listo.'
      emit('saved', created.id)
      await router.replace(anuncioEditarPath(created.id))
    }
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}

async function onSaveAsDraft() {
  form.status = 'draft'
  await onSave()
}

async function onPublishNow() {
  form.status = 'published'
  await onSave()
}

async function onCoverSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  const announcementId = persistedId.value
  if (!file || !announcementId) return
  saving.value = true
  try {
    const uploaded = await uploadAnnouncementMedia(announcementId, file, 'image')
    form.cover_image_path = uploaded.storage_path
    await updateAnnouncement({
      id: announcementId,
      ...buildPayload(),
      cover_image_path: uploaded.storage_path,
    })
    successMessage.value = 'Portada actualizada.'
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo subir la portada')
  } finally {
    saving.value = false
    if (coverInput.value) coverInput.value.value = ''
  }
}

async function onMediaSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  const announcementId = persistedId.value
  if (!file || !announcementId) return
  saving.value = true
  try {
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'file'
    const uploaded = await uploadAnnouncementMedia(announcementId, file, type)
    media.value = [...(media.value ?? []), uploaded]
    successMessage.value = 'Archivo agregado a la galería.'
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo subir el archivo')
  } finally {
    saving.value = false
    if (mediaInput.value) mediaInput.value.value = ''
  }
}

async function onDeleteMedia(item: NonNullable<AdminAnnouncement['media']>[number]) {
  if (!confirm('¿Eliminar este archivo?')) return
  await deleteAnnouncementMedia(item.id, item.storage_path)
  media.value = (media.value ?? []).filter((m) => m.id !== item.id)
}

const previewAnnouncement = computed(() => ({
  title: form.title || 'Título del anuncio',
  body: stripHtml(form.body_html),
  body_html: form.body_html,
  excerpt: form.excerpt,
  background_color: form.background_color,
  accent_color: form.accent_color,
  cover_image_path: form.cover_image_path,
  layout_style: form.layout_style,
  is_pinned: form.is_pinned,
  published_at: new Date().toISOString(),
  media: media.value ?? [],
}))

onMounted(async () => {
  await loadCourses()
  await loadAnnouncement()
})
</script>

<template>
  <div class="editor-form">
    <p v-if="loading" class="banner">Cargando editor…</p>
    <p v-if="errorMessage" class="banner error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="banner success">{{ successMessage }}</p>

    <div v-if="!loading" class="editor-grid">
      <section class="panel">
        <h2>Contenido visual</h2>

        <label>Título
          <input v-model="form.title" type="text" required placeholder="Título del anuncio">
        </label>

        <label>Resumen (opcional, para listados y notificaciones)
          <textarea v-model="form.excerpt" rows="2" placeholder="Breve descripción" />
        </label>

        <label>Cuerpo del anuncio</label>
        <ClientOnly>
          <CampusRichTextEditor
            v-model="form.body_html"
            v-model:design-json="form.design_json"
            min-height="360px"
          />
        </ClientOnly>

        <div class="color-row">
          <label>Fondo
            <input v-model="form.background_color" type="color">
          </label>
          <label>Acento
            <input v-model="form.accent_color" type="color">
          </label>
          <label>Layout
            <select v-model="form.layout_style">
              <option v-for="(label, key) in LAYOUT_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </label>
        </div>

        <div class="media-block">
          <h3>Imagen de portada</h3>
          <img
            v-if="form.cover_image_path"
            :src="getAnnouncementMediaUrl(form.cover_image_path)"
            alt="Portada"
            class="cover-preview"
          >
          <p v-if="!canUploadMedia" class="hint">Si el anuncio es nuevo, se guarda un borrador automáticamente al subir archivos (necesitás título).</p>
          <button type="button" class="media-btn" :disabled="saving" @click="openCoverPicker">
            Subir portada
          </button>
          <input
            ref="coverInput"
            type="file"
            accept="image/*"
            class="file-input"
            aria-label="Subir imagen de portada"
            @change="onCoverSelected"
          >
        </div>

        <div class="media-block">
          <h3>Galería de medios</h3>
          <p class="hint">Subí imágenes, videos o PDFs diseñados en herramientas externas.</p>
          <ul v-if="media?.length" class="media-list">
            <li v-for="item in media" :key="item.id">
              <span>{{ item.title }} ({{ item.media_type }})</span>
              <button type="button" class="danger" @click="onDeleteMedia(item)">Eliminar</button>
            </li>
          </ul>
          <button type="button" class="media-btn" :disabled="saving" @click="openMediaPicker">
            + Agregar imagen o video
          </button>
          <input
            ref="mediaInput"
            type="file"
            accept="image/*,video/*,.pdf"
            class="file-input"
            aria-label="Subir archivo multimedia"
            @change="onMediaSelected"
          >
        </div>
      </section>

      <section class="panel side">
        <h2>Publicación</h2>

        <label>Audiencia
          <select v-model="form.audience">
            <option v-for="(label, key) in AUDIENCE_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>

        <label v-if="form.audience === 'course'">Curso
          <select v-model="form.course_id">
            <option value="">Elegir curso</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">{{ course.title }}</option>
          </select>
        </label>

        <label>Estado
          <select v-model="form.status">
            <option value="draft">Borrador (solo staff)</option>
            <option value="published">Publicado (visible)</option>
            <option value="archived">Archivado</option>
          </select>
        </label>
        <p v-if="form.status === 'draft'" class="hint warn-hint">
          En borrador nadie del público/alumnado lo ve. Usá <strong>Publicar ahora</strong> cuando esté listo.
        </p>

        <label>Vencimiento (opcional)
          <input v-model="form.expires_at" type="datetime-local">
        </label>

        <label class="checkbox">
          <input v-model="form.is_pinned" type="checkbox">
          Destacar anuncio
        </label>

        <div class="save-row">
          <button type="button" class="save-btn save-btn--secondary" :disabled="saving" @click="onSaveAsDraft">
            {{ saving ? 'Guardando…' : 'Guardar borrador' }}
          </button>
          <button type="button" class="save-btn" :disabled="saving" @click="onPublishNow">
            {{ saving ? 'Guardando…' : 'Publicar ahora' }}
          </button>
        </div>

        <div class="preview-wrap">
          <h3>Vista previa</h3>
          <CampusAnnouncementRenderer :announcement="previewAnnouncement" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.editor-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.panel {
  background: var(--eg-surface);
  border-radius: 18px;
  padding: 24px;
  border: 1px solid var(--eg-border);
  display: grid;
  gap: 14px;
}

.panel h2, .panel h3 {
  margin: 0;
}

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
}

input[type="text"],
textarea,
select {
  padding: 10px 12px;
  border: 1px solid var(--eg-field-border);
  border-radius: 8px;
  font-family: inherit;
}

.color-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.media-block {
  padding-top: 10px;
  border-top: 1px solid var(--eg-row-border);
  display: grid;
  gap: 10px;
}

.cover-preview {
  max-width: 100%;
  border-radius: 12px;
}

.media-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.media-list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}

.hint { color: var(--eg-subtle); font-size: 13px; margin: 0; }
.warn-hint { color: var(--eg-ink); background: var(--eg-warn-bg, #f5f0e6); padding: 8px 10px; border-radius: 8px; }

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

button {
  border: 1px solid var(--eg-field-border);
  background: var(--eg-surface);
  color: var(--eg-action);
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.save-row {
  display: grid;
  gap: 8px;
}

.save-btn {
  background: var(--eg-accent);
  border-color: var(--eg-accent);
  color: var(--eg-surface);
}

.save-btn--secondary {
  background: var(--eg-surface);
  border-color: var(--eg-field-border);
  color: var(--eg-action);
}

.media-btn {
  background: var(--eg-info-bg);
  border-color: rgba(37, 99, 235, 0.25);
  color: var(--eg-action);
}

.media-btn:disabled,
button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.danger { color: var(--eg-error); }

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-wrap {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.banner {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--eg-info-bg);
}

.banner.error { background: var(--eg-error-bg); color: var(--eg-error); }
.banner.success { background: var(--eg-success-bg); color: var(--eg-success); }

@media (max-width: 1100px) {
  .editor-grid { grid-template-columns: 1fr; }
}
</style>
