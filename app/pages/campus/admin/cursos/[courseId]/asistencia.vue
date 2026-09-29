<script setup lang="ts">
import type {
  CourseStudentAttendanceDetail,
  CourseStudentAttendanceSummary,
} from '~/types/tracking'
import { ATTENDANCE_LABELS, type AttendanceStatus } from '~/types/tracking'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/cursos/:courseId/asistencia'],
})

const route = useRoute()
const { panelPath, panelLabel } = useCampusBackLink()
const { hasRole } = useCampusAuth()
const courseId = computed(() => route.params.courseId as string)
const canCorrectAttendance = computed(() =>
  hasRole('superadmin', 'admin', 'coordinador', 'docente', 'tutor'),
)
const isSuperadmin = computed(() => hasRole('superadmin'))

const { fetchCourseById } = useCourseContent()
const {
  fetchCourseStudents,
  fetchCourseAttendanceRecords,
  fetchCourseStudentAttendance,
  fetchStudentAttendanceDetail,
  findOrCreateSessionForDate,
  upsertAttendance,
  deleteAttendance,
} = useCourseTracking()

type StudentOption = {
  id: string
  full_name: string
  email: string | null
  avatar_url: string | null
}

const course = ref<Awaited<ReturnType<typeof fetchCourseById>>>(null)
const students = ref<StudentOption[]>([])
const records = ref<CourseStudentAttendanceDetail[]>([])
const studentSummaries = ref<CourseStudentAttendanceSummary[]>([])
const selectedStudentId = ref<string | null>(null)
const studentDetail = ref<CourseStudentAttendanceDetail[]>([])
const viewMode = ref<'registros' | 'alumnos'>('registros')
const showForm = ref(false)
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

useTrackFenixLoader(loading)

const form = reactive({
  session_date: new Date().toISOString().slice(0, 10),
  label: '',
  student_id: '',
  status: 'present' as AttendanceStatus,
  notes: '',
})

const selectedStudent = computed(() =>
  studentSummaries.value.find((s) => s.student_id === selectedStudentId.value) ?? null,
)

const statusChartBars = computed(() => {
  const counts = { present: 0, late: 0, absent: 0, excused: 0 }
  for (const row of records.value) counts[row.status] += 1
  return [
    { label: 'Asistió', value: counts.present + counts.late },
    { label: 'No asistió', value: counts.absent },
    { label: 'Justificado', value: counts.excused },
  ]
})

const studentHistoryBars = computed(() => {
  const s = selectedStudent.value
  if (!s) return []
  return [
    { label: 'Asistió', value: s.present_count },
    { label: 'Ausente', value: s.absent_count },
    { label: 'Justificado', value: s.excused_count },
  ]
})

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusButtonLabel(status: AttendanceStatus) {
  if (status === 'present') return 'Asistió'
  if (status === 'absent') return 'No asistió'
  if (status === 'excused') return 'Ausente justificado'
  return ATTENDANCE_LABELS[status]
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
    const [studentRows, recordRows, summaries] = await Promise.all([
      fetchCourseStudents(courseId.value),
      fetchCourseAttendanceRecords(courseId.value),
      fetchCourseStudentAttendance(courseId.value),
    ])
    students.value = studentRows
    records.value = recordRows
    studentSummaries.value = summaries
    if (!form.student_id && studentRows[0]) form.student_id = studentRows[0].id
    if (!selectedStudentId.value && summaries[0]) {
      selectedStudentId.value = summaries[0].student_id
    }
    if (selectedStudentId.value) {
      studentDetail.value = await fetchStudentAttendanceDetail(
        courseId.value,
        selectedStudentId.value,
      )
    }
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al cargar asistencia'
  } finally {
    loading.value = false
  }
}

function openForm() {
  errorMessage.value = ''
  successMessage.value = ''
  form.session_date = new Date().toISOString().slice(0, 10)
  form.label = ''
  form.status = 'present'
  form.notes = ''
  if (!form.student_id && students.value[0]) form.student_id = students.value[0].id
  showForm.value = true
  viewMode.value = 'registros'
}

async function onSaveRecord() {
  if (!form.student_id) {
    errorMessage.value = 'Elegí un alumno.'
    return
  }
  if (form.status === 'excused' && !form.notes.trim()) {
    errorMessage.value = 'La ausencia justificada requiere un motivo.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    const session = await findOrCreateSessionForDate(
      courseId.value,
      form.session_date,
      form.label || undefined,
    )
    await upsertAttendance(
      session.id,
      form.student_id,
      form.status,
      form.notes,
      { allowUpdate: canCorrectAttendance.value },
    )
    successMessage.value = 'Registro de asistencia guardado.'
    showForm.value = false
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}

async function onSelectStudent(studentId: string) {
  selectedStudentId.value = studentId
  viewMode.value = 'alumnos'
  studentDetail.value = await fetchStudentAttendanceDetail(courseId.value, studentId)
}

async function onDeleteRecord(recordId: string) {
  if (!isSuperadmin.value) return
  if (!confirm('¿Eliminar este registro de asistencia?')) return
  saving.value = true
  try {
    await deleteAttendance(recordId)
    successMessage.value = 'Registro eliminado.'
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo eliminar'
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
      eyebrow="ASISTENCIA"
      :title="course?.title || 'Cargando…'"
      description="Cargá un registro por alumno después de cada clase. El alumno solo consulta."
    >
      <template #actions>
        <CampusAdminCampusTableIconBtn
          icon="mdi:plus"
          label="Nuevo registro de asistencia"
          :disabled="loading || !students.length"
          @click="openForm"
        />
      </template>
    </CampusPageHeader>

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="asistencia" />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="campus-banner campus-banner--success">{{ successMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando…</p>

    <div v-if="!loading && course" class="attendance-tabs">
      <button
        type="button"
        class="attendance-tab"
        :class="{ active: viewMode === 'registros' }"
        @click="viewMode = 'registros'"
      >
        Registros
      </button>
      <button
        type="button"
        class="attendance-tab"
        :class="{ active: viewMode === 'alumnos' }"
        @click="viewMode = 'alumnos'"
      >
        Por alumno
      </button>
    </div>

    <!-- Formulario nuevo registro -->
    <section v-if="!loading && course && showForm" class="campus-admin-panel campus-glass attendance-form">
      <div class="campus-admin-panel__top">
        <h2>Nuevo registro de asistencia</h2>
        <button type="button" class="linkish" @click="showForm = false">Cerrar</button>
      </div>
      <p class="campus-admin-hint">
        Curso: <strong>{{ course.title }}</strong>. Elegí fecha, alumno y si asistió o no.
      </p>

      <div class="attendance-form-grid">
        <label>
          Fecha de la clase
          <input v-model="form.session_date" type="date">
        </label>
        <label>
          Nombre del encuentro (opcional)
          <input
            v-model="form.label"
            type="text"
            placeholder="Ej. Encuentro 3 — Zoom"
          >
        </label>
        <label>
          Alumno
          <select v-model="form.student_id">
            <option disabled value="">Elegí un alumno</option>
            <option v-for="student in students" :key="student.id" :value="student.id">
              {{ student.full_name }}
            </option>
          </select>
        </label>
      </div>

      <div class="status-choice" role="group" aria-label="Estado de asistencia">
        <button
          type="button"
          class="status-choice__btn"
          :class="{ active: form.status === 'present' }"
          @click="form.status = 'present'"
        >
          Asistió
        </button>
        <button
          type="button"
          class="status-choice__btn"
          :class="{ active: form.status === 'absent' }"
          @click="form.status = 'absent'"
        >
          No asistió
        </button>
        <button
          type="button"
          class="status-choice__btn"
          :class="{ active: form.status === 'excused' }"
          @click="form.status = 'excused'"
        >
          Ausente justificado
        </button>
      </div>

      <label v-if="form.status === 'excused'" class="motive-field">
        Motivo de la justificación
        <textarea v-model="form.notes" rows="2" placeholder="Obligatorio para justificados" />
      </label>

      <div class="attendance-form-actions">
        <CampusAdminCampusTableIconBtn
          icon="mdi:content-save-outline"
          label="Guardar registro"
          :disabled="saving || !form.student_id"
          @click="onSaveRecord"
        />
      </div>
    </section>

    <!-- Lista de registros -->
    <section v-if="!loading && course && viewMode === 'registros'" class="campus-admin-panel campus-glass">
      <div class="campus-admin-panel__top">
        <div>
          <h2>Registros cargados</h2>
          <p class="campus-admin-hint">Se van listando a medida que guardás cada alumno.</p>
        </div>
        <CampusAdminCampusTableIconBtn
          v-if="!showForm"
          icon="mdi:plus"
          label="Nuevo registro"
          :disabled="!students.length"
          @click="openForm"
        />
      </div>

      <CampusMiniBarChart
        v-if="records.length"
        class="attendance-mini-chart"
        :bars="statusChartBars"
      />

      <p v-if="!students.length" class="campus-admin-empty">
        No hay alumnos inscriptos en este curso. Primero inscribí alumnos.
      </p>
      <p v-else-if="!records.length" class="campus-admin-empty">
        Todavía no hay registros. Usá <strong>Nuevo registro de asistencia</strong>.
      </p>

      <div v-else class="records-list">
        <div v-for="row in records" :key="row.id" class="record-row">
          <div class="roster-student">
            <CampusAvatar :name="row.full_name || 'Alumno'" :src="row.avatar_url" size="sm" />
            <div>
              <strong>{{ row.full_name || 'Alumno' }}</strong>
              <small>
                {{ formatDate(row.session_date) }}
                · {{ row.session_title }}
              </small>
              <small v-if="row.notes" class="record-notes">Motivo: {{ row.notes }}</small>
            </div>
          </div>
          <div class="record-actions">
            <span class="status-pill" :class="row.status">{{ statusButtonLabel(row.status) }}</span>
            <CampusAdminCampusTableIconBtn
              v-if="isSuperadmin"
              icon="mdi:trash-can-outline"
              label="Eliminar"
              danger
              @click="onDeleteRecord(row.id)"
            />
          </div>
        </div>
      </div>
      <p v-if="!isSuperadmin && records.length" class="campus-admin-hint">
        Solo el superadmin puede corregir o eliminar un registro ya cargado.
      </p>
    </section>

    <!-- Por alumno -->
    <div v-if="!loading && course && viewMode === 'alumnos'" class="campus-attendance-layout">
      <section class="campus-admin-panel campus-glass">
        <h2>Alumnos</h2>
        <p v-if="!studentSummaries.length" class="campus-admin-empty">Sin alumnos inscriptos.</p>
        <div class="session-list">
          <div
            v-for="student in studentSummaries"
            :key="student.student_id"
            class="session-item"
            :class="{ active: selectedStudentId === student.student_id }"
            role="button"
            tabindex="0"
            @click="onSelectStudent(student.student_id)"
            @keydown.enter.prevent="onSelectStudent(student.student_id)"
          >
            <div class="roster-student">
              <CampusAvatar :name="student.full_name" :src="student.avatar_url" size="sm" />
              <div>
                <strong>{{ student.full_name }}</strong>
                <small>{{ student.email }}</small>
              </div>
            </div>
            <div class="session-meta">
              <span>{{ student.attendance_percent }}%</span>
            </div>
          </div>
        </div>
      </section>

      <section class="campus-admin-panel campus-glass">
        <h2>{{ selectedStudent?.full_name || 'Seleccioná un alumno' }}</h2>
        <CampusMiniBarChart
          v-if="selectedStudent && selectedStudent.marked_sessions"
          class="attendance-mini-chart"
          :bars="studentHistoryBars"
        />
        <p v-if="!selectedStudent" class="campus-admin-empty">Elegí un alumno.</p>
        <p v-else-if="!studentDetail.length" class="campus-admin-empty">Sin registros todavía.</p>
        <div v-else class="records-list">
          <div v-for="row in studentDetail" :key="row.id" class="record-row">
            <div>
              <strong>{{ row.session_title }}</strong>
              <small>{{ formatDate(row.session_date) }}</small>
              <small v-if="row.notes" class="record-notes">Motivo: {{ row.notes }}</small>
            </div>
            <div class="record-actions">
              <span class="status-pill" :class="row.status">{{ statusButtonLabel(row.status) }}</span>
              <CampusAdminCampusTableIconBtn
                v-if="isSuperadmin"
                icon="mdi:trash-can-outline"
                label="Eliminar"
                danger
                @click="onDeleteRecord(row.id)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.attendance-tabs {
  display: flex;
  gap: 0.5rem;
  margin: 0 0 1rem;
  flex-wrap: wrap;
}
.attendance-tab {
  border: 1px solid rgba(13, 44, 84, 0.14);
  background: #fff;
  border-radius: 999px;
  padding: 0.55rem 1rem;
  font-weight: 700;
  cursor: pointer;
}
.attendance-tab.active {
  background: var(--eg-ink);
  color: #fff;
  border-color: var(--eg-ink);
}
.attendance-form {
  margin-bottom: 1rem;
}
.attendance-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 1rem 0;
}
.attendance-form-grid label,
.motive-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 700;
}
.attendance-form-grid input,
.attendance-form-grid select,
.motive-field textarea {
  min-height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(13, 44, 84, 0.16);
  padding: 0.45rem 0.7rem;
  font: inherit;
  font-weight: 500;
}
.status-choice {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.status-choice__btn {
  border: 1px solid rgba(13, 44, 84, 0.16);
  background: #fff;
  border-radius: 999px;
  padding: 0.65rem 1rem;
  font-weight: 800;
  cursor: pointer;
}
.status-choice__btn.active {
  background: var(--eg-accent);
  border-color: var(--eg-accent);
  color: #fff;
}
.attendance-form-actions {
  margin-top: 0.75rem;
}
.linkish {
  border: none;
  background: transparent;
  color: var(--eg-action);
  font-weight: 700;
  cursor: pointer;
}
.attendance-mini-chart {
  margin: 0.5rem 0 1rem;
}
.records-list {
  display: flex;
  flex-direction: column;
}
.record-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(13, 44, 84, 0.08);
}
.record-notes {
  display: block;
  color: var(--campus-muted);
}
.record-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.status-pill {
  display: inline-flex;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  background: rgba(13, 44, 84, 0.08);
  white-space: nowrap;
}
.status-pill.present,
.status-pill.late {
  background: var(--eg-success-bg);
  color: var(--eg-success);
}
.status-pill.absent {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}
.status-pill.excused {
  background: rgba(242, 140, 40, 0.16);
  color: var(--eg-accent);
}
@media (max-width: 900px) {
  .attendance-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
