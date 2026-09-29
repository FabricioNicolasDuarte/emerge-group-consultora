<script setup lang="ts">
import type { ActivityLogEntry } from '~/types/audit'
import { ACTION_LABELS, ENTITY_LABELS } from '~/types/audit'
import { formatSupabaseError } from '~/utils/supabase-error'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin'],
  campusNav: {
    panel: 'admin',
    group: 'Sistema',
    label: 'Auditoría',
    icon: 'alertas',
    order: 2,
    requiredRoles: ['superadmin'],
  },
})

const user = useSupabaseUser()
const { fetchAdminCourses } = useAcademic()
const { fetchActivityLog } = useCampusAudit()

const logs = ref<ActivityLogEntry[]>([])
const courses = ref<{ id: string, title: string }[]>([])
const loading = ref(true)
const errorMessage = ref('')

useTrackFenixLoader(loading)

const filters = reactive({
  action: '',
  entity_type: '',
  course_id: '',
  days: 30,
})

async function loadData() {
  if (!user.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const [logRows, courseRows] = await Promise.all([
      fetchActivityLog({
        action: filters.action || undefined,
        entity_type: filters.entity_type || undefined,
        course_id: filters.course_id || undefined,
        days: filters.days || undefined,
        limit: 200,
      }),
      fetchAdminCourses(),
    ])
    logs.value = logRows
    courses.value = courseRows.map((course) => ({ id: course.id, title: course.title }))
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'Error al cargar auditoría')
  } finally {
    loading.value = false
  }
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action
}

function entityLabel(entityType: string) {
  return ENTITY_LABELS[entityType] ?? entityType
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  if (user.value) {
    loadData()
    return
  }
  const stop = watch(user, (current) => {
    if (current) {
      stop()
      loadData()
    }
  }, { immediate: true })
})
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="AUDITORÍA"
      title="Registro de actividad"
      description="Historial de acciones realizadas en el campus: cursos, inscripciones, notas, anuncios y asistencia."
    />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="campus-banner">Cargando…</p>

    <section v-if="!loading" class="campus-admin-panel campus-card">
      <h2>Filtros</h2>
      <div class="campus-filters-grid">
        <select v-model="filters.action" aria-label="Filtrar por acción">
          <option value="">Todas las acciones</option>
          <option v-for="(label, key) in ACTION_LABELS" :key="key" :value="key">
            {{ label }}
          </option>
        </select>

        <select v-model="filters.entity_type" aria-label="Filtrar por tipo de entidad">
          <option value="">Todos los tipos</option>
          <option v-for="(label, key) in ENTITY_LABELS" :key="key" :value="key">
            {{ label }}
          </option>
        </select>

        <select v-model="filters.course_id" aria-label="Filtrar por curso">
          <option value="">Todos los cursos</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.title }}
          </option>
        </select>

        <select v-model.number="filters.days" aria-label="Filtrar por período">
          <option :value="7">Últimos 7 días</option>
          <option :value="30">Últimos 30 días</option>
          <option :value="90">Últimos 90 días</option>
          <option :value="0">Todo el historial</option>
        </select>

        <button type="button" class="campus-btn campus-btn--primary" @click="loadData">
          Aplicar filtros
        </button>
      </div>
    </section>

    <section v-if="!loading" class="campus-admin-panel campus-card">
      <div class="campus-admin-panel__top">
        <h2>Actividad reciente</h2>
        <span class="campus-admin-hint">{{ logs.length }} registros</span>
      </div>

      <p v-if="!logs.length" class="campus-admin-empty">
        No hay registros para los filtros seleccionados. Los eventos se registran automáticamente al crear o modificar datos.
      </p>

      <div v-else class="campus-log-list">
        <article v-for="row in logs" :key="row.id" class="campus-log-card">
          <div class="campus-log-card__meta">
            <span class="campus-pill">{{ actionLabel(row.action) }}</span>
            <span class="campus-pill campus-pill--muted">{{ entityLabel(row.entity_type) }}</span>
            <time>{{ formatDate(row.created_at) }}</time>
          </div>
          <p class="campus-log-card__summary">{{ row.summary }}</p>
          <div class="campus-log-card__footer">
            <span v-if="row.actor_name">
              Por <strong>{{ row.actor_name }}</strong>
            </span>
            <span v-else>Sistema</span>
            <span v-if="row.course_title"> · {{ row.course_title }}</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
