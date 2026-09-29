<script setup lang="ts">
import type { Assessment } from '~/types/tracking'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/cursos/:courseId/calificaciones'],
})

const route = useRoute()
const courseId = computed(() => route.params.courseId as string)
const { panelPath, panelLabel } = useCampusBackLink()

const { fetchCourseById } = useCourseContent()
const {
  fetchAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  buildGradebook,
  upsertGrade,
} = useCourseTracking()

const course = ref<Awaited<ReturnType<typeof fetchCourseById>>>(null)
const assessments = ref<Assessment[]>([])
const students = ref<{ id: string, full_name: string, email: string | null, avatar_url?: string | null }[]>([])
const gradeMap = ref<Map<string, { grade_id: string | null, score: number | null, feedback: string }>>(new Map())
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')

useTrackFenixLoader(loading)

const newAssessment = reactive({
  title: '',
  max_score: 100,
  weight_percent: 100,
  due_date: '',
})

const editCells = ref<Record<string, string>>({})

function cellKey(studentId: string, assessmentId: string) {
  return `${studentId}:${assessmentId}`
}

function getCellScore(studentId: string, assessmentId: string) {
  const key = cellKey(studentId, assessmentId)
  if (editCells.value[key] !== undefined) return editCells.value[key]
  const cell = gradeMap.value.get(key)
  return cell?.score != null ? String(cell.score) : ''
}

function setCellScore(studentId: string, assessmentId: string, value: string) {
  editCells.value[cellKey(studentId, assessmentId)] = value
}

async function loadGradebook() {
  const data = await buildGradebook(courseId.value)
  students.value = data.students
  assessments.value = data.assessments
  gradeMap.value = data.gradeMap
  editCells.value = {}
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
    await loadGradebook()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al cargar calificaciones'
  } finally {
    loading.value = false
  }
}

async function onCreateAssessment() {
  if (!newAssessment.title.trim()) return
  saving.value = true
  try {
    await createAssessment({
      course_id: courseId.value,
      title: newAssessment.title,
      max_score: newAssessment.max_score,
      weight_percent: newAssessment.weight_percent,
      due_date: newAssessment.due_date || null,
      is_published: true,
    })
    newAssessment.title = ''
    newAssessment.due_date = ''
    await loadGradebook()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la evaluación'
  } finally {
    saving.value = false
  }
}

async function setAssessmentPublished(assessment: Assessment, value: boolean) {
  if (assessment.is_published === value) return
  saving.value = true
  try {
    await updateAssessment(assessment.id, { is_published: value })
    assessment.is_published = value
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo actualizar'
  } finally {
    saving.value = false
  }
}

async function onDeleteAssessment(assessmentId: string) {
  if (!confirm('¿Eliminar esta evaluación y sus notas?')) return
  saving.value = true
  try {
    await deleteAssessment(assessmentId)
    await loadGradebook()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo eliminar'
  } finally {
    saving.value = false
  }
}

async function onSaveGrades() {
  saving.value = true
  try {
    const tasks: Promise<unknown>[] = []
    for (const student of students.value) {
      for (const assessment of assessments.value) {
        const key = cellKey(student.id, assessment.id)
        if (editCells.value[key] === undefined) continue
        const raw = editCells.value[key]!.trim()
        const score = raw === '' ? null : Number(raw)
        if (raw !== '' && Number.isNaN(score)) continue
        tasks.push(upsertGrade(assessment.id, student.id, score))
      }
    }
    await Promise.all(tasks)
    await loadGradebook()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudieron guardar las notas'
  } finally {
    saving.value = false
  }
}

function studentAverage(studentId: string) {
  const scores: number[] = []
  for (const assessment of assessments.value) {
    const cell = gradeMap.value.get(cellKey(studentId, assessment.id))
    if (cell?.score != null && assessment.max_score > 0) {
      scores.push((cell.score / assessment.max_score) * 100)
    }
  }
  if (!scores.length) return '—'
  return `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`
}

onMounted(loadData)
</script>

<template>
  <div class="campus-mgmt-ambient">
    <NuxtLink :to="panelPath" class="panel-back">← Volver a {{ panelLabel }}</NuxtLink>
    <CampusPageHeader
      eyebrow="CALIFICACIONES"
      :title="course?.title || 'Cargando…'"
      description="Libro de notas por evaluación y alumno."
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

    <CampusCourseManagementNav
      v-if="course"
      :course-id="courseId"
      active="calificaciones"
    />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando…</p>

    <section v-if="!loading && course" class="mgmt-compose campus-glass">
      <h2>Nueva evaluación</h2>
      <div class="mgmt-compose-form">
        <input v-model="newAssessment.title" type="text" placeholder="Título de la evaluación" aria-label="Título de la evaluación">
        <input v-model.number="newAssessment.max_score" type="number" min="1" placeholder="Puntaje máximo" aria-label="Puntaje máximo">
        <input v-model.number="newAssessment.weight_percent" type="number" min="1" max="100" placeholder="Peso %" aria-label="Peso porcentual">
        <input v-model="newAssessment.due_date" type="date" aria-label="Fecha de entrega">
        <CampusAdminCampusTableIconBtn
          icon="mdi:plus"
          label="Crear evaluación"
          :disabled="saving || !newAssessment.title.trim()"
          @click="onCreateAssessment"
        />
      </div>
    </section>

    <section v-if="!loading && course" class="campus-admin-panel campus-glass">
      <div class="campus-admin-panel__top">
        <h2>Libro de notas</h2>
        <CampusAdminCampusTableIconBtn
          icon="mdi:content-save-outline"
          label="Guardar notas"
          :disabled="saving || !assessments.length"
          @click="onSaveGrades"
        />
      </div>

      <p v-if="!assessments.length" class="campus-admin-empty">Creá una evaluación para empezar a cargar notas.</p>
      <p v-else-if="!students.length" class="campus-admin-empty">No hay alumnos inscriptos en este curso.</p>

      <div v-else class="gradebook-scroll">
        <table class="gradebook-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th v-for="assessment in assessments" :key="assessment.id">
                <div class="assessment-head">
                  <span>{{ assessment.title }}</span>
                  <small>Máx {{ assessment.max_score }} · {{ assessment.weight_percent }}%</small>
                  <div class="assessment-actions">
                    <CampusSwitch
                      :model-value="assessment.is_published"
                      :label="assessment.is_published ? 'Visible' : 'Oculta'"
                      :disabled="saving"
                      @update:model-value="(v) => setAssessmentPublished(assessment, v)"
                    />
                    <CampusAdminCampusTableIconBtn
                      icon="mdi:trash-can-outline"
                      label="Eliminar evaluación"
                      danger
                      @click="onDeleteAssessment(assessment.id)"
                    />
                  </div>
                </div>
              </th>
              <th>Promedio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td class="student-cell">
                <div class="roster-student">
                  <CampusAvatar :name="student.full_name" :src="student.avatar_url" size="sm" />
                  <div>
                    <strong>{{ student.full_name }}</strong>
                    <small>{{ student.email }}</small>
                  </div>
                </div>
              </td>
              <td v-for="assessment in assessments" :key="assessment.id">
                <input
                  type="number"
                  min="0"
                  :max="assessment.max_score"
                  step="0.5"
                  :value="getCellScore(student.id, assessment.id)"
                  :disabled="saving"
                  @input="setCellScore(student.id, assessment.id, ($event.target as HTMLInputElement).value)"
                >
              </td>
              <td class="average-cell">{{ studentAverage(student.id) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
