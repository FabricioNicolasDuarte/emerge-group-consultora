<script setup lang="ts">
import type { LessonRow, ModuleRow, LessonMaterial } from '~/types/content'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/cursos/:courseId/contenido'],
})

const route = useRoute()
const courseId = computed(() => route.params.courseId as string)
const { panelPath, panelLabel } = useCampusBackLink()

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
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al cargar contenido'
  } finally {
    loading.value = false
  }
}

async function onCreateModule() {
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
      is_published: false,
    })
    form.title = ''
    form.video_url = ''
    successMessage.value = 'Clase creada.'
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la clase'
  } finally {
    saving.value = false
  }
}

async function togglePublish(lesson: LessonRow) {
  saving.value = true
  try {
    await updateLesson(lesson.id, { is_published: !lesson.is_published })
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo actualizar la clase'
  } finally {
    saving.value = false
  }
}

async function onDeleteModule(moduleId: string) {
  if (!confirm('¿Eliminar este módulo y todas sus clases?')) return
  saving.value = true
  try {
    await deleteModule(moduleId)
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo eliminar el módulo'
  } finally {
    saving.value = false
  }
}

async function onDeleteLesson(lessonId: string) {
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

async function loadLessonMaterials(lessonId: string) {
  materialsLoading.value[lessonId] = true
  try {
    lessonMaterials.value[lessonId] = await fetchLessonMaterials(lessonId)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron cargar los materiales'
  } finally {
    materialsLoading.value[lessonId] = false
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

async function onDeleteMaterial(material: LessonMaterial) {
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
  editingLesson.value = { ...lesson }
}

async function onSaveLesson() {
  if (!editingLesson.value) return
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
  <div>
    <NuxtLink :to="panelPath" class="panel-back">← Volver a {{ panelLabel }}</NuxtLink>
    <CampusPageHeader
      eyebrow="GESTIÓN DE CONTENIDO"
      :title="course?.title || 'Cargando…'"
      :description="course ? 'Administrá módulos, clases, videos y materiales del programa.' : undefined"
    >
      <template #actions>
        <NuxtLink v-if="course" :to="`/campus/cursos/${course.slug}`" class="campus-btn campus-btn--primary">
          Ver curso →
        </NuxtLink>
      </template>
    </CampusPageHeader>

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="contenido" />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="campus-banner campus-banner--success">{{ successMessage }}</p>
    <p v-if="loading" class="campus-banner">Cargando contenido…</p>

    <section v-if="!loading && course" class="campus-admin-panel campus-card">
      <h2>Nuevo módulo</h2>
      <div class="campus-inline-form">
        <input v-model="newModuleTitle" type="text" placeholder="Título del módulo" aria-label="Título del módulo">
        <button type="button" class="campus-btn campus-btn--primary" :disabled="saving" @click="onCreateModule">
          + Agregar módulo
        </button>
      </div>
    </section>

    <section v-for="mod in modules" :key="mod.id" class="campus-admin-panel campus-card course-module-block">
      <div class="course-module-top">
        <div>
          <span>MÓDULO {{ mod.sort_order }}</span>
          <h2>{{ mod.title }}</h2>
        </div>
        <div class="campus-course-actions">
          <button type="button" class="campus-btn" @click="onExpandModule(mod.id)">
            {{ expandedModule === mod.id ? 'Ocultar' : 'Gestionar clases' }}
          </button>
          <button type="button" class="campus-btn danger" @click="onDeleteModule(mod.id)">
            Eliminar
          </button>
        </div>
      </div>

      <div v-if="expandedModule === mod.id" class="course-lessons-panel">
        <div v-for="lesson in mod.lessons" :key="lesson.id" class="course-lesson-row">
          <div>
            <strong>{{ lesson.title }}</strong>
            <small>
              {{ lesson.is_published ? 'Publicada' : 'Borrador' }}
              <template v-if="lesson.video_url"> · Video cargado</template>
            </small>
          </div>
          <div class="campus-course-actions">
            <button type="button" class="campus-btn" @click="onEditLesson(lesson)">Editar</button>
            <button type="button" class="campus-btn" @click="togglePublish(lesson)">
              {{ lesson.is_published ? 'Ocultar' : 'Publicar' }}
            </button>
            <label class="campus-btn campus-upload-btn">
              Subir PDF
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" hidden @change="onUploadMaterial(lesson, $event)">
            </label>
            <button type="button" class="campus-btn danger" @click="onDeleteLesson(lesson.id)">
              Eliminar
            </button>
          </div>

          <div v-if="materialsLoading[lesson.id]" class="course-materials-hint">Cargando materiales…</div>
          <ul v-else-if="lessonMaterials[lesson.id]?.length" class="course-materials-list">
            <li v-for="material in lessonMaterials[lesson.id]" :key="material.id">
              <span>{{ material.title }}</span>
              <small>{{ material.mime_type || 'archivo' }}</small>
              <button type="button" class="campus-btn danger" @click="onDeleteMaterial(material)">Eliminar</button>
            </li>
          </ul>
          <p v-else class="course-materials-hint">Sin materiales adjuntos.</p>
        </div>

        <div class="campus-inline-form">
          <input v-model="getLessonForm(mod.id).title" type="text" placeholder="Título de la clase" aria-label="Título de la clase">
          <input v-model="getLessonForm(mod.id).video_url" type="url" placeholder="URL de YouTube/Vimeo (opcional)" aria-label="URL de video de la clase">
          <button type="button" class="campus-btn campus-btn--primary" :disabled="saving" @click="onCreateLesson(mod.id)">
            + Agregar clase
          </button>
        </div>
      </div>
    </section>

    <div v-if="editingLesson" class="campus-modal-overlay" @click.self="editingLesson = null">
      <div class="campus-modal">
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
          URL de video (YouTube, Vimeo o MP4)
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
