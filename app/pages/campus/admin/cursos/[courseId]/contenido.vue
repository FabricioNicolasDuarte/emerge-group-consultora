<script setup lang="ts">
import type { LessonRow, ModuleRow, LessonMaterial } from '~/types/content'
import { Icon } from '@iconify/vue'
import { formatDuration, lessonTypeLabel } from '~/utils/video'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/cursos/:courseId/contenido'],
})

const route = useRoute()
const courseId = computed(() => route.params.courseId as string)
const { panelPath, panelLabel } = useCampusBackLink()
const { hasRole } = useCampusAuth()
const canMutateContent = computed(() => hasRole('superadmin'))

const {
  fetchCourseById,
  fetchModules,
  fetchLessonsForCourse,
  createModule,
  createLesson,
  updateLesson,
  deleteModule,
  deleteLesson,
  uploadLessonMaterial,
  fetchLessonMaterials,
  getMaterialDownloadUrl,
  deleteMaterial,
} = useCourseContent()

const course = ref<Awaited<ReturnType<typeof fetchCourseById>>>(null)
const modules = ref<ModuleRow[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const newModuleTitle = ref('')
const expandedModule = ref<string | null>(null)
const lessonForms = ref<Record<string, { title: string, video_url: string }>>({})
const editingLesson = ref<LessonRow | null>(null)
const lessonMaterials = ref<Record<string, LessonMaterial[]>>({})
const materialsLoading = ref<Record<string, boolean>>({})
const materialUrls = ref<Record<string, string>>({})
const materialUrlErrors = ref<Record<string, string>>({})
const openingMaterialId = ref<string | null>(null)
const uploadInputs = new Map<string, HTMLInputElement>()

function setUploadInput(lessonId: string, el: unknown) {
  if (el instanceof HTMLInputElement) {
    uploadInputs.set(lessonId, el)
  } else {
    uploadInputs.delete(lessonId)
  }
}

function lessonPlayerPath(lessonId: string) {
  if (!course.value?.slug) return '#'
  return `/campus/cursos/${course.value.slug}/${lessonId}`
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    course.value = await fetchCourseById(courseId.value)
    if (!course.value) {
      errorMessage.value = 'Curso no encontrado.'
      return
    }

    const [moduleRows, lessons] = await Promise.all([
      fetchModules(courseId.value),
      fetchLessonsForCourse(courseId.value),
    ])

    const byModule = new Map<string, LessonRow[]>()
    for (const lesson of lessons) {
      const list = byModule.get(lesson.module_id) ?? []
      list.push(lesson)
      byModule.set(lesson.module_id, list)
    }

    modules.value = moduleRows.map((mod) => ({
      ...mod,
      lessons: (byModule.get(mod.id) ?? []).sort((a, b) => a.sort_order - b.sort_order),
    }))

    if (!expandedModule.value && modules.value[0]) {
      await onExpandModule(modules.value[0].id)
    } else if (expandedModule.value) {
      const mod = modules.value.find((m) => m.id === expandedModule.value)
      if (mod?.lessons?.length) {
        await Promise.all(mod.lessons.map((lesson) => loadLessonMaterials(lesson.id)))
      }
    }
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al cargar contenido'
  } finally {
    loading.value = false
  }
}

async function onCreateModule() {
  if (!canMutateContent.value) return
  if (!newModuleTitle.value.trim()) return
  saving.value = true
  try {
    const sortOrder = modules.value.length + 1
    await createModule({
      course_id: courseId.value,
      title: newModuleTitle.value,
      sort_order: sortOrder,
    })
    newModuleTitle.value = ''
    successMessage.value = 'Módulo creado.'
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear el módulo'
  } finally {
    saving.value = false
  }
}

function getLessonForm(moduleId: string) {
  if (!lessonForms.value[moduleId]) {
    lessonForms.value[moduleId] = { title: '', video_url: '' }
  }
  return lessonForms.value[moduleId]
}

async function onCreateLesson(moduleId: string) {
  if (!canMutateContent.value) return
  const form = getLessonForm(moduleId)
  if (!form.title.trim()) return
  saving.value = true
  try {
    const mod = modules.value.find((m) => m.id === moduleId)
    const sortOrder = (mod?.lessons?.length ?? 0) + 1
    await createLesson({
      module_id: moduleId,
      title: form.title,
      video_url: form.video_url || null,
      sort_order: sortOrder,
      is_published: true,
    })
    form.title = ''
    form.video_url = ''
    successMessage.value = 'Clase creada y publicada.'
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la clase'
  } finally {
    saving.value = false
  }
}

async function setPublished(lesson: LessonRow, value: boolean) {
  if (!canMutateContent.value || lesson.is_published === value) return
  saving.value = true
  try {
    await updateLesson(lesson.id, { is_published: value })
    lesson.is_published = value
    successMessage.value = value ? 'Clase publicada.' : 'Clase oculta.'
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo actualizar la clase'
  } finally {
    saving.value = false
  }
}

async function onDeleteModule(moduleId: string) {
  if (!canMutateContent.value) return
  if (!confirm('¿Eliminar este módulo y todas sus clases?')) return
  saving.value = true
  try {
    await deleteModule(moduleId)
    if (expandedModule.value === moduleId) expandedModule.value = null
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo eliminar el módulo'
  } finally {
    saving.value = false
  }
}

async function onDeleteLesson(lessonId: string) {
  if (!canMutateContent.value) return
  if (!confirm('¿Eliminar esta clase?')) return
  saving.value = true
  try {
    await deleteLesson(lessonId)
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo eliminar la clase'
  } finally {
    saving.value = false
  }
}

async function resolveMaterialUrl(material: LessonMaterial) {
  try {
    materialUrls.value[material.id] = await getMaterialDownloadUrl(material.storage_path, {
      downloadName: material.title,
    })
    delete materialUrlErrors.value[material.id]
  } catch (error: unknown) {
    materialUrlErrors.value[material.id] = error instanceof Error
      ? error.message
      : 'No se pudo preparar el enlace'
  }
}

async function loadLessonMaterials(lessonId: string) {
  materialsLoading.value[lessonId] = true
  try {
    const rows = await fetchLessonMaterials(lessonId)
    lessonMaterials.value[lessonId] = rows
    await Promise.all(rows.map((material) => resolveMaterialUrl(material)))
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar los materiales'
  } finally {
    materialsLoading.value[lessonId] = false
  }
}

async function refreshMaterialUrl(material: LessonMaterial) {
  openingMaterialId.value = material.id
  try {
    await resolveMaterialUrl(material)
  } finally {
    openingMaterialId.value = null
  }
}

async function onExpandModule(moduleId: string) {
  if (expandedModule.value === moduleId) {
    expandedModule.value = null
    return
  }
  expandedModule.value = moduleId
  const mod = modules.value.find((m) => m.id === moduleId)
  if (mod?.lessons?.length) {
    await Promise.all(mod.lessons.map((lesson) => loadLessonMaterials(lesson.id)))
  }
}

async function onUploadMaterial(lesson: LessonRow, event: Event) {
  if (!canMutateContent.value) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  saving.value = true
  try {
    await uploadLessonMaterial(courseId.value, lesson.id, file)
    successMessage.value = 'Material subido.'
    input.value = ''
    await loadLessonMaterials(lesson.id)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo subir el archivo'
  } finally {
    saving.value = false
  }
}

function triggerUpload(lessonId: string) {
  uploadInputs.get(lessonId)?.click()
}

async function onDeleteMaterial(material: LessonMaterial) {
  if (!canMutateContent.value) return
  if (!confirm(`¿Eliminar "${material.title}"?`)) return
  saving.value = true
  try {
    await deleteMaterial(material)
    successMessage.value = 'Material eliminado.'
    await loadLessonMaterials(material.lesson_id)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo eliminar el material'
  } finally {
    saving.value = false
  }
}

async function onEditLesson(lesson: LessonRow) {
  if (!canMutateContent.value) return
  editingLesson.value = { ...lesson }
}

async function onSaveLesson() {
  if (!canMutateContent.value || !editingLesson.value) return
  saving.value = true
  try {
    await updateLesson(editingLesson.value.id, {
      title: editingLesson.value.title,
      description: editingLesson.value.description,
      video_url: editingLesson.value.video_url,
      content_html: editingLesson.value.content_html,
      duration_minutes: editingLesson.value.duration_minutes,
      content_type: editingLesson.value.content_type,
    })
    editingLesson.value = null
    successMessage.value = 'Clase actualizada.'
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo guardar la clase'
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="campus-mgmt-ambient">
    <NuxtLink :to="panelPath" class="panel-back">← Volver a {{ panelLabel }}</NuxtLink>
    <CampusPageHeader
      eyebrow="CONTENIDO"
      :title="course?.title || 'Cargando…'"
      :description="course ? 'Módulos y clases en tarjetas, con preview de video.' : undefined"
    >
      <template #actions>
        <CampusAdminCampusTableIconBtn
          v-if="course"
          icon="mdi:eye-outline"
          label="Vista alumno"
          :to="`/campus/cursos/${course.slug}`"
        />
      </template>
    </CampusPageHeader>

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="contenido" />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="campus-banner campus-banner--success">{{ successMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando contenido…</p>
    <p v-if="!loading && course && !canMutateContent" class="campus-banner">
      Podés ver y abrir clases. Solo el <strong>superadmin</strong> edita o publica contenido.
    </p>

    <section v-if="!loading && course && canMutateContent" class="mgmt-compose campus-glass">
      <h2>Nuevo módulo</h2>
      <div class="mgmt-compose-form">
        <input v-model="newModuleTitle" type="text" placeholder="Título del módulo" aria-label="Título del módulo">
        <CampusAdminCampusTableIconBtn
          icon="mdi:plus"
          label="Agregar módulo"
          :disabled="saving || !newModuleTitle.trim()"
          @click="onCreateModule"
        />
      </div>
    </section>

    <p v-if="!loading && course && !modules.length" class="mgmt-empty campus-glass">
      Este curso todavía no tiene módulos.
    </p>

    <section
      v-for="mod in modules"
      :key="mod.id"
      class="mgmt-module campus-glass"
    >
      <div
        class="mgmt-module__head"
        role="button"
        tabindex="0"
        :aria-expanded="expandedModule === mod.id"
        @click="onExpandModule(mod.id)"
        @keydown.enter.prevent="onExpandModule(mod.id)"
        @keydown.space.prevent="onExpandModule(mod.id)"
      >
        <div>
          <span class="mgmt-module__kicker">Módulo {{ mod.sort_order }}</span>
          <h2>{{ mod.title }}</h2>
        </div>
        <div class="mgmt-module__tools" @click.stop>
          <span class="mgmt-pill mgmt-pill--draft">{{ mod.lessons?.length ?? 0 }} clases</span>
          <CampusAdminCampusTableIconBtn
            :icon="expandedModule === mod.id ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            :label="expandedModule === mod.id ? 'Ocultar clases' : 'Ver clases'"
            @click="onExpandModule(mod.id)"
          />
          <CampusAdminCampusTableIconBtn
            v-if="canMutateContent"
            icon="mdi:trash-can-outline"
            label="Eliminar módulo"
            danger
            @click="onDeleteModule(mod.id)"
          />
        </div>
      </div>

      <div v-if="expandedModule === mod.id">
        <div v-if="!mod.lessons?.length" class="mgmt-empty">Sin clases en este módulo.</div>

        <div v-else class="mgmt-lesson-grid">
          <article
            v-for="lesson in mod.lessons"
            :key="lesson.id"
            class="mgmt-lesson-card"
          >
            <CampusVideoThumb
              :url="lesson.video_url"
              :title="lesson.title"
              :to="lessonPlayerPath(lesson.id)"
            />

            <div class="mgmt-lesson-card__body">
              <h3 class="mgmt-lesson-card__title">{{ lesson.title }}</h3>
              <div class="mgmt-lesson-card__meta">
                <span class="mgmt-pill" :class="lesson.is_published ? 'mgmt-pill--ok' : 'mgmt-pill--draft'">
                  {{ lesson.is_published ? 'Publicada' : 'Borrador' }}
                </span>
                <span>{{ lessonTypeLabel(lesson.content_type) }}</span>
                <span v-if="lesson.duration_minutes">{{ formatDuration(lesson.duration_minutes) }}</span>
              </div>

              <div v-if="canMutateContent" class="mgmt-lesson-card__actions">
                <CampusSwitch
                  :model-value="lesson.is_published"
                  :label="lesson.is_published ? 'Publicada' : 'Oculta'"
                  :disabled="saving"
                  @update:model-value="(v) => setPublished(lesson, v)"
                />
              </div>

              <div class="mgmt-lesson-card__actions">
                <CampusAdminCampusTableIconBtn
                  icon="mdi:play-circle-outline"
                  label="Ver clase"
                  :to="lessonPlayerPath(lesson.id)"
                />
                <CampusAdminCampusTableIconBtn
                  v-if="lesson.video_url"
                  icon="mdi:open-in-new"
                  label="Abrir video"
                  :to="lesson.video_url"
                />
                <template v-if="canMutateContent">
                  <CampusAdminCampusTableIconBtn
                    icon="mdi:pencil-outline"
                    label="Editar"
                    @click="onEditLesson(lesson)"
                  />
                  <CampusAdminCampusTableIconBtn
                    icon="mdi:file-upload-outline"
                    label="Subir material"
                    @click="triggerUpload(lesson.id)"
                  />
                  <input
                    :ref="(el) => setUploadInput(lesson.id, el)"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    hidden
                    @change="onUploadMaterial(lesson, $event)"
                  >
                  <CampusAdminCampusTableIconBtn
                    icon="mdi:trash-can-outline"
                    label="Eliminar clase"
                    danger
                    @click="onDeleteLesson(lesson.id)"
                  />
                </template>
              </div>

              <div v-if="materialsLoading[lesson.id]" class="course-materials-hint">Cargando materiales…</div>
              <div v-else-if="lessonMaterials[lesson.id]?.length" class="mgmt-materials">
                <div
                  v-for="material in lessonMaterials[lesson.id]"
                  :key="material.id"
                  class="mgmt-material-row"
                >
                  <Icon icon="mdi:file-document-outline" width="16" height="16" aria-hidden="true" />
                  <span :title="material.title">{{ material.title }}</span>
                  <CampusAdminCampusTableIconBtn
                    v-if="materialUrls[material.id]"
                    icon="mdi:download-outline"
                    label="Abrir material"
                    :to="materialUrls[material.id]"
                  />
                  <CampusAdminCampusTableIconBtn
                    v-else
                    icon="mdi:refresh"
                    label="Reintentar enlace"
                    :disabled="openingMaterialId === material.id"
                    @click="refreshMaterialUrl(material)"
                  />
                  <CampusAdminCampusTableIconBtn
                    v-if="canMutateContent"
                    icon="mdi:trash-can-outline"
                    label="Eliminar material"
                    danger
                    @click="onDeleteMaterial(material)"
                  />
                </div>
                <p
                  v-for="material in lessonMaterials[lesson.id]?.filter((m) => materialUrlErrors[m.id])"
                  :key="`${material.id}-err`"
                  class="material-item-error"
                >
                  {{ material.title }}: {{ materialUrlErrors[material.id] }}
                </p>
              </div>
              <p v-else class="course-materials-hint">Sin materiales.</p>
            </div>
          </article>
        </div>

        <div v-if="canMutateContent" class="mgmt-compose" style="margin: 0 1.15rem 1.15rem; padding: 1rem;">
          <h2>Nueva clase</h2>
          <div class="mgmt-compose-form">
            <input
              v-model="getLessonForm(mod.id).title"
              type="text"
              placeholder="Título de la clase"
              aria-label="Título de la clase"
            >
            <input
              v-model="getLessonForm(mod.id).video_url"
              type="url"
              placeholder="URL de YouTube, Vimeo o Drive"
              aria-label="URL de video"
            >
            <CampusAdminCampusTableIconBtn
              icon="mdi:plus"
              label="Agregar clase"
              :disabled="saving || !getLessonForm(mod.id).title.trim()"
              @click="onCreateLesson(mod.id)"
            />
          </div>
        </div>
      </div>
    </section>

    <div v-if="editingLesson && canMutateContent" class="campus-modal-overlay" @click.self="editingLesson = null">
      <div class="campus-modal campus-glass">
        <h2>Editar clase</h2>
        <label>
          Título
          <input v-model="editingLesson.title" type="text">
        </label>
        <label>
          Descripción
          <textarea v-model="editingLesson.description" rows="2" />
        </label>
        <label>
          URL de video
          <input v-model="editingLesson.video_url" type="url">
        </label>
        <label>
          Duración (minutos)
          <input v-model.number="editingLesson.duration_minutes" type="number" min="0">
        </label>
        <label>
          Contenido HTML
          <textarea v-model="editingLesson.content_html" rows="6" />
        </label>
        <div class="campus-modal-actions">
          <button type="button" class="campus-btn" @click="editingLesson = null">Cancelar</button>
          <button type="button" class="campus-btn campus-btn--primary" :disabled="saving" @click="onSaveLesson">
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
