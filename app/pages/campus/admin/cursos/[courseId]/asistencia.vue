<script setup lang="ts">
import type { CourseSessionStats, SessionStudentRow } from '~/types/tracking'
import { ATTENDANCE_LABELS, ATTENDANCE_OPTIONS } from '~/types/tracking'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/cursos/:courseId/asistencia'],
})

const route = useRoute()
const { panelPath, panelLabel } = useCampusBackLink()
const courseId = computed(() => route.params.courseId as string)

const { fetchCourseById } = useCourseContent()
const {
  fetchCourseSessions,
  createSession,
  deleteSession,
  fetchSessionRoster,
  upsertAttendance,
  markAllPresent,
} = useCourseTracking()

const course = ref<Awaited<ReturnType<typeof fetchCourseById>>>(null)
const sessions = ref<CourseSessionStats[]>([])
const selectedSessionId = ref<string | null>(null)
const roster = ref<SessionStudentRow[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')

const newSession = reactive({
  title: '',
  session_date: new Date().toISOString().slice(0, 10),
  start_time: '10:00',
  meeting_url: '',
  meeting_provider: 'jitsi',
})

const selectedSession = computed(() =>
  sessions.value.find((s) => s.id === selectedSessionId.value) ?? null,
)

async function loadSessions() {
  sessions.value = await fetchCourseSessions(courseId.value)
  if (!selectedSessionId.value && sessions.value.length) {
    selectedSessionId.value = sessions.value[0]!.id
  }
}

async function loadRoster() {
  if (!selectedSessionId.value) {
    roster.value = []
    return
  }
  roster.value = await fetchSessionRoster(selectedSessionId.value, courseId.value)
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
    await loadSessions()
    await loadRoster()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al cargar asistencia'
  } finally {
    loading.value = false
  }
}

async function onCreateSession() {
  if (!newSession.title.trim()) return
  saving.value = true
  try {
    const created = await createSession({
      course_id: courseId.value,
      title: newSession.title,
      session_date: newSession.session_date,
      start_time: newSession.start_time,
      meeting_url: newSession.meeting_url || null,
      meeting_provider: newSession.meeting_provider,
    })
    newSession.title = ''
    newSession.meeting_url = ''
    await loadSessions()
    selectedSessionId.value = created.id
    await loadRoster()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo crear la sesión'
  } finally {
    saving.value = false
  }
}

async function onSelectSession(sessionId: string) {
  selectedSessionId.value = sessionId
  await loadRoster()
}

async function onStatusChange(studentId: string, status: string) {
  if (!selectedSessionId.value) return
  saving.value = true
  try {
    await upsertAttendance(
      selectedSessionId.value,
      studentId,
      status as 'present' | 'absent' | 'late' | 'excused',
    )
    await loadRoster()
    await loadSessions()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo guardar'
  } finally {
    saving.value = false
  }
}

async function onMarkAllPresent() {
  if (!selectedSessionId.value) return
  saving.value = true
  try {
    await markAllPresent(selectedSessionId.value, courseId.value)
    await loadRoster()
    await loadSessions()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo marcar asistencia'
  } finally {
    saving.value = false
  }
}

async function onDeleteSession(sessionId: string) {
  if (!confirm('¿Eliminar esta sesión y su asistencia?')) return
  saving.value = true
  try {
    await deleteSession(sessionId)
    if (selectedSessionId.value === sessionId) selectedSessionId.value = null
    await loadSessions()
    await loadRoster()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo eliminar'
  } finally {
    saving.value = false
  }
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(loadData)
</script>

<template>
  <div class="campus-mgmt-ambient">
    <NuxtLink :to="panelPath" class="panel-back">← Volver a {{ panelLabel }}</NuxtLink>
    <CampusPageHeader
      eyebrow="ASISTENCIA"
      :title="course?.title || 'Cargando…'"
      description="Registrá la asistencia por encuentro sincrónico o presencial."
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

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="asistencia" />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando…</p>

    <div v-if="!loading && course" class="campus-attendance-layout">
      <section class="campus-admin-panel campus-glass">
        <h2>Sesiones</h2>
        <div class="campus-inline-form campus-inline-form--stack">
          <input v-model="newSession.title" type="text" placeholder="Título del encuentro" aria-label="Título del encuentro">
          <input v-model="newSession.session_date" type="date" aria-label="Fecha del encuentro">
          <input v-model="newSession.start_time" type="time" aria-label="Hora de inicio">
          <input v-model="newSession.meeting_url" type="url" placeholder="Link videoconferencia (opcional)" aria-label="Link de videoconferencia">
          <select v-model="newSession.meeting_provider" aria-label="Plataforma de videoconferencia">
            <option value="jitsi">Jitsi Meet</option>
            <option value="zoom">Zoom</option>
            <option value="meet">Google Meet</option>
            <option value="teams">Microsoft Teams</option>
            <option value="other">Otro</option>
          </select>
          <CampusAdminCampusTableIconBtn
            icon="mdi:plus"
            label="Crear sesión"
            :disabled="saving || !newSession.title.trim()"
            @click="onCreateSession"
          />
        </div>

        <p v-if="!sessions.length" class="campus-admin-empty">No hay sesiones cargadas.</p>

        <div class="session-list">
          <div
            v-for="session in sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: selectedSessionId === session.id }"
            role="button"
            tabindex="0"
            @click="onSelectSession(session.id)"
            @keydown.enter.prevent="onSelectSession(session.id)"
            @keydown.space.prevent="onSelectSession(session.id)"
          >
            <div>
              <strong>{{ session.title }}</strong>
              <small>{{ formatDate(session.session_date) }}</small>
            </div>
            <div class="session-meta">
              <span>{{ session.present_count }}/{{ session.total_marked }} presentes</span>
              <CampusAdminCampusTableIconBtn
                icon="mdi:trash-can-outline"
                label="Eliminar sesión"
                danger
                @click.stop="onDeleteSession(session.id)"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="campus-admin-panel campus-glass">
        <div class="campus-admin-panel__top">
          <div>
            <h2>{{ selectedSession?.title || 'Seleccioná una sesión' }}</h2>
            <p v-if="selectedSession" class="campus-admin-hint">
              {{ formatDate(selectedSession.session_date) }}
              <template v-if="selectedSession.start_time">
                · {{ selectedSession.start_time.slice(0, 5) }}
              </template>
            </p>
          </div>
          <CampusAdminCampusTableIconBtn
            v-if="selectedSession"
            icon="mdi:check-all"
            label="Marcar todos presentes"
            :disabled="saving"
            @click="onMarkAllPresent"
          />
        </div>

        <p v-if="!selectedSession" class="campus-admin-empty">Elegí una sesión para cargar asistencia.</p>
        <p v-else-if="!roster.length" class="campus-admin-empty">No hay alumnos inscriptos en este curso.</p>

        <div v-else class="roster-table">
          <div class="roster-row roster-head">
            <span>Alumno</span>
            <span>Estado</span>
          </div>
          <div v-for="row in roster" :key="row.student_id" class="roster-row">
            <div class="roster-student">
              <CampusAvatar :name="row.full_name" :src="row.avatar_url" size="sm" />
              <div>
                <strong>{{ row.full_name }}</strong>
                <small>{{ row.email }}</small>
              </div>
            </div>
            <select
              :value="row.status || 'absent'"
              :disabled="saving"
              @change="onStatusChange(row.student_id, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in ATTENDANCE_OPTIONS" :key="opt" :value="opt">
                {{ ATTENDANCE_LABELS[opt] }}
              </option>
            </select>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
