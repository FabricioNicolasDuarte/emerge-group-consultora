<script setup lang="ts">
import type { LessonRow, ModuleRow } from '~/types/content'
import { formatDuration, lessonTypeLabel } from '~/utils/video'
import { scrollToSection } from '~/utils/scroll'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

definePageMeta({ layout: 'campus-course' })

const { fetchCurriculum, getAllLessons } = useCourseContent()
const { user, hasAnyStaffRole } = useCampusAuth()
const { homePath, homeLabel } = useCampusPanelHome()
const {
  courseContenidoPath,
  courseAsistenciaPath,
  courseCalificacionesPath,
} = useCampusStaffPaths()
const { fetchMyCertificates } = useCampusCommerce()

const curriculum = ref<Awaited<ReturnType<typeof fetchCurriculum>>>(null)
const certificateCode = ref<string | null>(null)
const loading = ref(true)
const errorMessage = ref('')

const progress = computed(() => curriculum.value?.enrollmentProgress ?? 0)
const isCourseComplete = computed(() => progress.value >= 100)
const canAccess = computed(() => curriculum.value?.canAccessContent ?? false)
const isEnrolled = computed(() => curriculum.value?.isEnrolled ?? false)
const isStaff = computed(() => hasAnyStaffRole())

const allLessons = computed(() =>
  curriculum.value ? getAllLessons(curriculum.value.modules) : [],
)

const visibleLessons = computed(() =>
  allLessons.value.filter((lesson) => lesson.is_published || isStaff.value),
)

const nextLesson = computed(() => {
  if (!curriculum.value) return null
  const completions = curriculum.value.completions
  return visibleLessons.value.find((l) => !completions.has(l.id)) ?? visibleLessons.value[0] ?? null
})

function moduleStatus(mod: ModuleRow) {
  const lessons = (mod.lessons ?? []).filter((l) => l.is_published || isStaff.value)
  if (!lessons.length) return 'empty'
  const done = lessons.every((l) => curriculum.value?.completions.has(l.id))
  if (done) return 'completed'
  const started = lessons.some((l) => curriculum.value?.completions.has(l.id))
  if (started) return 'current'
  return 'pending'
}

function moduleProgress(mod: ModuleRow) {
  const lessons = (mod.lessons ?? []).filter((l) => l.is_published || isStaff.value)
  if (!lessons.length) return 0
  const done = lessons.filter((l) => curriculum.value?.completions.has(l.id)).length
  return Math.round((done / lessons.length) * 100)
}

function lessonState(lesson: LessonRow) {
  if (curriculum.value?.completions.has(lesson.id)) return 'completed'
  if (lesson.id === nextLesson.value?.id) return 'current'
  if (!lesson.is_published && isStaff.value) return 'draft'
  return 'pending'
}

function lessonLink(lesson: LessonRow) {
  if (!canAccess.value && !isStaff.value) return null
  return `/campus/cursos/${slug.value}/${lesson.id}`
}

function scrollToEnroll() {
  scrollToSection('inscripcion')
}

async function loadCurriculum() {
  loading.value = true
  errorMessage.value = ''
  try {
    curriculum.value = await fetchCurriculum(slug.value)
    if (!curriculum.value) {
      errorMessage.value = 'Curso no encontrado.'
      return
    }
    if ((curriculum.value.enrollmentProgress ?? 0) >= 100) {
      const certs = await fetchMyCertificates().catch(() => [])
      const match = certs.find((c) => c.course_id === curriculum.value!.course.id)
      certificateCode.value = match?.certificate_code ?? null
    }
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al cargar el curso'
  } finally {
    loading.value = false
  }
}

const panelLink = computed(() => (user.value ? homePath.value : '/campus'))

const panelBackLabel = computed(() => {
  if (!user.value) return 'Volver al Campus'
  if (homeLabel.value === 'mi campus') return 'Volver a Mi Campus'
  if (homeLabel.value === 'panel docente') return 'Volver al Panel Docente'
  return 'Volver a Administración'
})

const loginRedirect = computed(() =>
  `/campus/login?redirect=${encodeURIComponent(`/campus/cursos/${slug.value}`)}`,
)

onMounted(() => {
  loadCurriculum()
})

usePublicSeo(() => ({
  title: curriculum.value?.course.title
    ? `${curriculum.value.course.title} — Campus Emerge`
    : 'Programa — Campus Emerge',
  description: curriculum.value?.course.description
    || 'Programa de formación online en Campus Emerge.',
}))
</script>

<template>
  <div class="course-page">

    <aside class="course-sidebar">

      <NuxtLink :to="panelLink" class="course-logo">
        <BrandLogo variant="markOnDark" />
      </NuxtLink>

      <span class="campus-name">CAMPUS EMERGE</span>

      <NuxtLink :to="panelLink" class="back-panel">
        ← {{ panelBackLabel }}
      </NuxtLink>

      <div v-if="curriculum" class="sidebar-course-info">
        <span>{{ curriculum.course.category.toUpperCase() }}</span>
        <h2>{{ curriculum.course.title }}</h2>
        <p>{{ curriculum.course.description }}</p>
      </div>

      <div v-if="curriculum && canAccess" class="sidebar-progress">
        <div class="progress-info">
          <span>Tu progreso</span>
          <strong>{{ progress }}%</strong>
        </div>
        <div class="progress-bar">
          <div class="progress" :style="{ width: `${progress}%` }" />
        </div>
      </div>

    </aside>

    <main id="main-content" class="course-main">

      <p v-if="loading" class="state-message">Cargando curso…</p>
      <p v-else-if="errorMessage" class="state-message error">{{ errorMessage }}</p>

      <template v-else-if="curriculum">

        <header class="course-header">
          <div>
            <span class="header-label">PROGRAMA DE FORMACIÓN</span>
            <h1>{{ curriculum.course.title }}</h1>
            <p>{{ curriculum.course.description }}</p>
          </div>
        </header>

        <CampusCompletionBanner
          v-if="isCourseComplete && canAccess && !isStaff"
          :course-title="curriculum.course.title"
          :certificate-code="certificateCode"
        />

        <section v-if="isStaff && curriculum" class="staff-course-tools">
          <span class="section-label">GESTIÓN DEL CURSO</span>
          <div class="staff-course-links">
            <NuxtLink :to="courseContenidoPath(curriculum.course.id)">Contenido</NuxtLink>
            <NuxtLink :to="courseAsistenciaPath(curriculum.course.id)">Asistencia</NuxtLink>
            <NuxtLink :to="courseCalificacionesPath(curriculum.course.id)">Calificaciones</NuxtLink>
          </div>
        </section>

        <CourseEnrollCard
          v-if="!isStaff"
          :course-id="curriculum.course.id"
          :course-title="curriculum.course.title"
          :price-amount="curriculum.course.price_amount"
          :price-currency="curriculum.course.price_currency"
          :is-enrolled="isEnrolled"
          :is-logged-in="Boolean(user)"
          :enrollment-open="curriculum.enrollmentMeta?.enrollment_open ?? true"
          :seats-remaining="curriculum.enrollmentMeta?.seats_remaining ?? null"
          :enrollment-cap="curriculum.course.enrollment_cap"
          :cohort-start-date="curriculum.course.cohort_start_date"
          :cohort-end-date="curriculum.course.cohort_end_date"
          :enrollment-starts-at="curriculum.course.enrollment_starts_at"
          :enrollment-ends-at="curriculum.course.enrollment_ends_at"
          @enrolled="loadCurriculum"
        />

        <CoursePublicTrust v-if="!isStaff" />

        <section v-if="canAccess && nextLesson && !isCourseComplete" class="continue-learning">
          <div>
            <span class="section-label">CONTINUAR APRENDIENDO</span>
            <h2>Tu próxima clase</h2>
            <h3>Módulo {{ nextLesson.module.sort_order }} · {{ nextLesson.module.title }}</h3>
            <p>{{ nextLesson.description || nextLesson.title }}</p>
          </div>
          <NuxtLink
            :to="`/campus/cursos/${slug}/${nextLesson.id}`"
            class="continue-button"
          >
            Continuar clase →
          </NuxtLink>
        </section>

        <section class="modules-section">
          <div class="section-heading">
            <span class="section-label">CONTENIDO DEL PROGRAMA</span>
            <h2>Módulos y clases</h2>
          </div>

          <p v-if="!curriculum.modules.length" class="state-message">
            Este curso aún no tiene módulos cargados.
          </p>

          <article
            v-for="mod in curriculum.modules"
            :key="mod.id"
            class="module-card"
            :class="{
              completed: moduleStatus(mod) === 'completed',
              current: moduleStatus(mod) === 'current',
              locked: moduleStatus(mod) === 'pending' && !canAccess,
            }"
          >
            <div class="module-header">
              <div class="module-number">{{ String(mod.sort_order).padStart(2, '0') }}</div>
              <div>
                <span>
                  {{
                    moduleStatus(mod) === 'completed' ? 'MÓDULO COMPLETADO'
                    : moduleStatus(mod) === 'current' ? 'EN CURSO'
                      : 'MÓDULO'
                  }}
                </span>
                <h3>{{ mod.title }}</h3>
              </div>
              <div class="module-status">
                {{ moduleStatus(mod) === 'completed' ? '✓' : `${moduleProgress(mod)}%` }}
              </div>
            </div>

            <div class="lessons">
              <div
                v-for="lesson in (mod.lessons ?? []).filter(l => l.is_published || isStaff)"
                :key="lesson.id"
                class="lesson"
                :class="lessonState(lesson)"
              >
                <span class="lesson-icon">
                  {{ lessonState(lesson) === 'completed' ? '✓' : lessonState(lesson) === 'current' ? '▶' : '○' }}
                </span>
                <div>
                  <strong>{{ lesson.title }}</strong>
                  <small>
                    {{ lessonTypeLabel(lesson.content_type) }}
                    <template v-if="lesson.duration_minutes"> · {{ formatDuration(lesson.duration_minutes) }}</template>
                    <template v-if="!lesson.is_published && isStaff"> · Borrador</template>
                  </small>
                </div>
                <NuxtLink
                  v-if="lessonLink(lesson)"
                  :to="lessonLink(lesson)!"
                  class="lesson-btn"
                  :class="{ primary: lessonState(lesson) === 'current' }"
                >
                  {{ lessonState(lesson) === 'completed' ? 'Ver' : lessonState(lesson) === 'current' ? 'Continuar' : 'Abrir' }}
                </NuxtLink>
                <NuxtLink
                  v-else-if="!user"
                  :to="loginRedirect"
                  class="lesson-locked"
                >
                  Iniciá sesión
                </NuxtLink>
                <button
                  v-else
                  type="button"
                  class="lesson-locked enroll-cta"
                  @click="scrollToEnroll"
                >
                  Inscribite para acceder
                </button>
              </div>

              <p v-if="!(mod.lessons ?? []).filter(l => l.is_published || isStaff).length" class="empty-lessons">
                Sin clases publicadas en este módulo.
              </p>
            </div>
          </article>
        </section>

      </template>

    </main>

  </div>
</template>
