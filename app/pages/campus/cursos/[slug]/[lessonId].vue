<script setup lang="ts">
import type { LessonMaterial } from '~/types/content'
import { formatSupabaseError } from '~/utils/supabase-error'
import { formatDuration, lessonTypeLabel } from '~/utils/video'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const lessonId = computed(() => route.params.lessonId as string)

definePageMeta({ layout: 'campus-course' })

const {
  fetchLesson,
  fetchCurriculum,
  fetchLessonMaterials,
  getMaterialDownloadUrl,
  markLessonComplete,
  unmarkLessonComplete,
  fetchEnrollmentProgress,
  findNextLesson,
  findPreviousLesson,
} = useCourseContent()
const { user, hasAnyStaffRole } = useCampusAuth()
const { fetchMyCertificates } = useCampusCommerce()

const loading = ref(true)
const errorMessage = ref('')
const completing = ref(false)
const materialError = ref('')
const openingMaterialId = ref<string | null>(null)
const isComplete = ref(false)

const lessonData = ref<Awaited<ReturnType<typeof fetchLesson>>>(null)
const curriculum = ref<Awaited<ReturnType<typeof fetchCurriculum>>>(null)
const materials = ref<LessonMaterial[]>([])
const materialUrls = ref<Record<string, string>>({})
const materialUrlErrors = ref<Record<string, string>>({})
const certificateCode = ref<string | null>(null)

const isStaff = computed(() => hasAnyStaffRole())
const canAccess = computed(() => curriculum.value?.canAccessContent || isStaff.value)
const isCourseComplete = computed(() => (curriculum.value?.enrollmentProgress ?? 0) >= 100)

const moduleLessons = computed(() => {
  if (!curriculum.value || !lessonData.value) return []
  const mod = curriculum.value.modules.find((m) => m.id === lessonData.value!.module.id)
  return (mod?.lessons ?? []).filter((l) => l.is_published || isStaff.value)
})

const lessonIndex = computed(() =>
  moduleLessons.value.findIndex((l) => l.id === lessonId.value) + 1,
)

const prevLesson = computed(() =>
  curriculum.value ? findPreviousLesson(curriculum.value.modules, lessonId.value) : null,
)

const nextLesson = computed(() =>
  curriculum.value ? findNextLesson(curriculum.value.modules, lessonId.value) : null,
)

async function loadMaterials() {
  materialError.value = ''
  materialUrls.value = {}
  materialUrlErrors.value = {}
  materials.value = await fetchLessonMaterials(lessonId.value)

  await Promise.all(materials.value.map(async (material) => {
    try {
      materialUrls.value[material.id] = await getMaterialDownloadUrl(material.storage_path, {
        downloadName: material.title,
      })
    } catch (error: unknown) {
      materialUrlErrors.value[material.id] = error instanceof Error
        ? error.message
        : 'No se pudo preparar el enlace'
    }
  }))
}

async function refreshMaterialUrl(material: LessonMaterial) {
  materialError.value = ''
  openingMaterialId.value = material.id
  try {
    materialUrls.value[material.id] = await getMaterialDownloadUrl(material.storage_path, {
      downloadName: material.title,
    })
    delete materialUrlErrors.value[material.id]
  } catch (error: unknown) {
    materialUrlErrors.value[material.id] = error instanceof Error
      ? error.message
      : 'No se pudo preparar el enlace'
  } finally {
    openingMaterialId.value = null
  }
}

function materialIcon(mime: string | null) {
  if (!mime) return 'DOC'
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('word') || mime.includes('document')) return 'DOC'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPT'
  return 'FILE'
}

async function refreshProgress() {
  if (!curriculum.value) return
  const courseId = curriculum.value.course.id
  const progress = await fetchEnrollmentProgress(courseId)
  if (progress !== null) {
    curriculum.value.enrollmentProgress = progress
  }
  if ((progress ?? 0) >= 100) {
    const certs = await fetchMyCertificates().catch(() => [])
    const match = certs.find((c) => c.course_id === courseId)
    certificateCode.value = match?.certificate_code ?? null
  }
}

async function toggleComplete() {
  completing.value = true
  errorMessage.value = ''
  try {
    if (isComplete.value) {
      await unmarkLessonComplete(lessonId.value)
      isComplete.value = false
      curriculum.value?.completions.delete(lessonId.value)
    } else {
      await markLessonComplete(lessonId.value)
      isComplete.value = true
      curriculum.value?.completions.add(lessonId.value)
    }
    await refreshProgress()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo actualizar el estado'
  } finally {
    completing.value = false
  }
}

onMounted(async () => {
  try {
    lessonData.value = await fetchLesson(lessonId.value)
    if (!lessonData.value) {
      errorMessage.value = 'Clase no encontrada.'
      return
    }

    if (lessonData.value.course.slug !== slug.value) {
      await navigateTo(`/campus/cursos/${lessonData.value.course.slug}/${lessonId.value}`, { replace: true })
      return
    }

    curriculum.value = await fetchCurriculum(slug.value)
    if (!curriculum.value?.canAccessContent && !isStaff.value) {
      errorMessage.value = 'Necesitás estar inscripto para ver esta clase.'
      return
    }

    isComplete.value = curriculum.value?.completions.has(lessonId.value) ?? false
    await loadMaterials()
    await refreshProgress()
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'Error al cargar la clase')
  } finally {
    loading.value = false
  }
})

usePublicSeo(() => ({
  title: lessonData.value?.lesson.title
    ? `${lessonData.value.lesson.title} — ${lessonData.value.course.title}`
    : 'Clase — Campus Emerge',
  description: lessonData.value?.lesson.description
    || lessonData.value?.course.description
    || 'Clase del programa de formación en Campus Emerge.',
  noindex: true,
}))
</script>

<template>
  <div class="lesson-page">

    <aside class="lesson-sidebar">

      <NuxtLink :to="`/campus/cursos/${slug}`" class="lesson-logo">
        <BrandLogo variant="markOnDark" />
      </NuxtLink>

      <span class="campus-name">CAMPUS EMERGE</span>

      <NuxtLink :to="`/campus/cursos/${slug}`" class="back-course">
        ← Volver al curso
      </NuxtLink>

      <div v-if="lessonData" class="sidebar-info">
        <span>MÓDULO {{ lessonData.module.sort_order }}</span>
        <h2>{{ lessonData.module.title }}</h2>
        <p v-if="lessonIndex">
          Clase {{ lessonIndex }} de {{ moduleLessons.length }}
        </p>
      </div>

      <div v-if="curriculum" class="sidebar-progress">
        <div class="progress-info">
          <span>Progreso del curso</span>
          <strong>{{ curriculum.enrollmentProgress ?? 0 }}%</strong>
        </div>
        <div class="progress-bar">
          <div
            class="progress"
            :style="{ width: `${curriculum.enrollmentProgress ?? 0}%` }"
          />
        </div>
      </div>

      <nav v-if="moduleLessons.length" class="sidebar-lessons">
        <span class="sidebar-lessons-label">CLASES DEL MÓDULO</span>
        <NuxtLink
          v-for="lesson in moduleLessons"
          :key="lesson.id"
          :to="`/campus/cursos/${slug}/${lesson.id}`"
          class="sidebar-lesson-link"
          :class="{
            active: lesson.id === lessonId,
            completed: curriculum.completions.has(lesson.id),
          }"
        >
          {{ curriculum.completions.has(lesson.id) ? '✓' : '○' }}
          {{ lesson.title }}
        </NuxtLink>
      </nav>

    </aside>

    <main id="main-content" class="lesson-main">

      <p v-if="loading" class="state-message">Cargando clase…</p>
      <p v-else-if="errorMessage" class="state-message error">{{ errorMessage }}</p>

      <template v-else-if="lessonData && canAccess">

        <header class="lesson-header">
          <span class="section-label">
            {{ lessonData.course.title.toUpperCase() }} · MÓDULO {{ lessonData.module.sort_order }}
          </span>
          <h1>{{ lessonData.lesson.title }}</h1>
          <p>{{ lessonData.lesson.description }}</p>
          <small class="lesson-meta">
            {{ lessonTypeLabel(lessonData.lesson.content_type) }}
            <template v-if="lessonData.lesson.duration_minutes">
              · {{ formatDuration(lessonData.lesson.duration_minutes) }}
            </template>
          </small>
        </header>

        <CampusCompletionBanner
          v-if="isCourseComplete && !isStaff"
          :course-title="lessonData.course.title"
          :certificate-code="certificateCode"
        />

        <section v-if="lessonData.lesson.content_type === 'video'" class="lesson-video">
          <CampusCourseVideoPlayer
            :url="lessonData.lesson.video_url"
            :title="lessonData.lesson.title"
          />
        </section>

        <section class="lesson-content-grid">

          <div class="lesson-content">

            <span class="section-label">SOBRE ESTA CLASE</span>
            <h2>{{ lessonData.lesson.title }}</h2>

            <div
              v-if="lessonData.lesson.content_html"
              class="content-html"
              v-html="lessonData.lesson.content_html"
            />
            <p v-else>{{ lessonData.lesson.description }}</p>

          </div>

          <aside class="lesson-resources">

            <div v-if="materials.length" class="resource-card">
              <span class="section-label">MATERIALES</span>
              <h3>Recursos de la clase</h3>
              <p v-if="materialError" class="material-error">{{ materialError }}</p>

              <div
                v-for="material in materials"
                :key="material.id"
                class="resource-item"
              >
                <div class="resource-icon">{{ materialIcon(material.mime_type) }}</div>
                <div class="resource-copy">
                  <strong>{{ material.title }}</strong>
                  <small>{{ material.mime_type || 'Archivo' }}</small>
                  <small v-if="materialUrlErrors[material.id]" class="material-item-error">
                    {{ materialUrlErrors[material.id] }}
                  </small>
                </div>
                <a
                  v-if="materialUrls[material.id]"
                  :href="materialUrls[material.id]"
                  class="resource-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir
                </a>
                <button
                  v-else
                  type="button"
                  :disabled="openingMaterialId === material.id"
                  @click="refreshMaterialUrl(material)"
                >
                  {{ openingMaterialId === material.id ? '…' : 'Reintentar' }}
                </button>
              </div>
            </div>

            <div class="complete-card">
              <span class="section-label">PROGRESO</span>
              <h3>{{ isComplete ? 'Clase completada' : 'Marcar como vista' }}</h3>
              <p>
                {{
                  isComplete
                    ? 'Ya registramos esta clase como completada en tu progreso.'
                    : 'Marcá la clase como completada cuando termines de verla o leerla.'
                }}
              </p>
              <button type="button" :disabled="completing" @click="toggleComplete">
                {{ completing ? 'Guardando…' : isComplete ? 'Desmarcar completada' : 'Marcar completada' }}
              </button>
            </div>

          </aside>

        </section>

        <section class="lesson-navigation">
          <NuxtLink
            v-if="prevLesson"
            :to="`/campus/cursos/${slug}/${prevLesson.id}`"
            class="nav-btn prev"
          >
            ← Clase anterior
          </NuxtLink>
          <span v-else class="nav-spacer" />

          <div v-if="lessonIndex">
            <span>Clase {{ lessonIndex }} de {{ moduleLessons.length }}</span>
          </div>

          <NuxtLink
            v-if="nextLesson"
            :to="`/campus/cursos/${slug}/${nextLesson.id}`"
            class="nav-btn next"
          >
            Siguiente clase →
          </NuxtLink>
          <NuxtLink
            v-else
            :to="`/campus/cursos/${slug}`"
            class="nav-btn next"
          >
            Volver al curso →
          </NuxtLink>
        </section>

      </template>

      <div v-else-if="!canAccess && !loading" class="access-box">
        <h2>Contenido restringido</h2>
        <p>Iniciá sesión e inscribite en el curso para acceder a esta clase.</p>
        <NuxtLink to="/campus/login">Ingresar al Campus →</NuxtLink>
      </div>

    </main>

  </div>
</template>
