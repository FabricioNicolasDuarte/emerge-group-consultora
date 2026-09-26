<script setup lang="ts">
import type { ApplicationStatus } from '~/types/applications'
import { APPLICATION_STATUS_LABELS } from '~/types/applications'

definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['superadmin', 'admin', 'coordinador'],
  campusNav: {
    panel: 'admin',
    group: 'General',
    label: 'Solicitudes',
    icon: 'pagos',
    order: 5,
  },
})

const admin = useAdminCampusData()
const apps = useEnrollmentApplications()

const fileInput = ref<HTMLInputElement | null>(null)
const importCourseId = ref('')
const showImport = ref(false)

const statusOptions: Array<{ value: ApplicationStatus | 'all', label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'ready', label: 'Listos' },
  { value: 'pending', label: 'En duda' },
  { value: 'converted', label: 'Convertidos' },
  { value: 'rejected', label: 'Rechazados' },
]

onMounted(async () => {
  if (!admin.courses.length) await admin.loadData()
  // Por defecto: todos los cursos (no filtrar al primero)
  if (!importCourseId.value) {
    const diplomatura = admin.courses.find((c) => c.slug === 'diplomatura-gestion-liderazgo')
    importCourseId.value = diplomatura?.id || admin.courses[0]?.id || ''
  }
  apps.courseFilter = ''
  await apps.loadApplications()
})

async function onPickFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !importCourseId.value) return
  try {
    await apps.importExcel(file, importCourseId.value)
    showImport.value = false
  } finally {
    input.value = ''
  }
}

function statusClass(status: ApplicationStatus) {
  if (status === 'ready') return 'status active'
  if (status === 'pending') return 'status draft'
  if (status === 'converted') return 'status'
  return 'status draft'
}
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="INGRESO"
      title="Solicitudes de inscripción"
      description="Importá el Excel de la Diplomatura, revisá verdes/naranjas y generá usuarios e inscripciones."
    >
      <template #actions>
        <button type="button" class="campus-btn" @click="showImport = true">Importar Excel</button>
        <button
          type="button"
          class="campus-btn"
          :disabled="!apps.selectedIds.length || apps.loading"
          @click="apps.convertSelected()"
        >
          Crear seleccionados
        </button>
        <button
          type="button"
          class="campus-btn campus-btn--primary"
          :disabled="!importCourseId || apps.loading"
          @click="apps.convertAllReady(importCourseId)"
        >
          Crear todos los listos
        </button>
      </template>
    </CampusPageHeader>

    <p v-if="apps.errorMessage" class="campus-banner campus-banner--error">{{ apps.errorMessage }}</p>
    <p v-if="apps.successMessage" class="campus-banner campus-banner--success">{{ apps.successMessage }}</p>

    <section class="campus-admin-panel campus-card" style="margin-bottom: 1rem;">
      <div class="campus-admin-panel__top">
        <h3>Resumen</h3>
        <button
          v-if="apps.lastCredentials.length"
          type="button"
          class="campus-btn campus-btn--primary"
          @click="apps.downloadCredentialsCsv"
        >
          Descargar contraseñas CSV
        </button>
      </div>
      <p class="campus-admin-hint">
        Listos: <strong>{{ apps.readyCount }}</strong>
        · En duda: <strong>{{ apps.pendingCount }}</strong>
        · Total: <strong>{{ apps.applications.length }}</strong>
      </p>
      <p class="campus-admin-hint">
        Verde = crear usuario. Naranja = en duda (no crear hasta confirmar).
        Tras convertir, descargá el CSV y enviá email + contraseña por WhatsApp.
      </p>
    </section>

    <div class="table-toolbar" style="gap: 0.75rem; flex-wrap: wrap;">
      <select v-model="apps.courseFilter" class="table-search" aria-label="Filtrar curso" style="max-width: 220px;">
        <option value="">Todos los cursos</option>
        <option v-for="course in admin.courses" :key="course.id" :value="course.id">
          {{ course.title }}
        </option>
      </select>
      <select v-model="apps.statusFilter" class="table-search" aria-label="Filtrar estado" style="max-width: 180px;">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input
        v-model="apps.search"
        type="search"
        placeholder="Buscar nombre, email, ciudad…"
        class="table-search"
        aria-label="Buscar solicitud"
      >
      <button type="button" class="campus-btn" @click="apps.selectAllReadyVisible">Seleccionar listos visibles</button>
      <button type="button" class="campus-btn" :disabled="apps.loading" @click="apps.loadApplications">Actualizar</button>
    </div>

    <div class="table-card campus-card">
      <div class="table-row table-header" style="grid-template-columns: 36px 1.4fr 1.2fr 0.9fr 0.9fr 0.8fr 1fr;">
        <span />
        <span>Persona</span>
        <span>Contacto</span>
        <span>Rol / Ciudad</span>
        <span>Estado</span>
        <span>Curso</span>
        <span>Acciones</span>
      </div>

      <div v-if="apps.loading && !apps.filtered.length" class="table-empty">Cargando…</div>
      <div v-else-if="!apps.filtered.length" class="table-empty">
        No hay solicitudes. Importá el Excel de la Diplomatura.
      </div>

      <div
        v-for="row in apps.filtered"
        :key="row.id"
        class="table-row"
        style="grid-template-columns: 36px 1.4fr 1.2fr 0.9fr 0.9fr 0.8fr 1fr; align-items: start;"
      >
        <div>
          <input
            type="checkbox"
            :disabled="row.status !== 'ready'"
            :checked="Array.isArray(apps.selectedIds) && apps.selectedIds.includes(row.id)"
            :aria-label="`Seleccionar ${row.full_name}`"
            @change="apps.toggleSelected(row.id)"
          >
        </div>
        <div>
          <strong>{{ row.full_name }}</strong>
          <small v-if="row.audience">{{ row.audience }}</small>
          <small v-if="row.challenge" style="display:block; opacity:0.8;">{{ row.challenge }}</small>
        </div>
        <div>
          <span>{{ row.email }}</span>
          <small v-if="row.phone">{{ row.phone }}</small>
        </div>
        <div>
          <span>{{ row.job_role || '—' }}</span>
          <small>{{ [row.occupation, row.city].filter(Boolean).join(' · ') || '—' }}</small>
        </div>
        <span :class="statusClass(row.status)">{{ APPLICATION_STATUS_LABELS[row.status] }}</span>
        <span>{{ row.course_title || '—' }}</span>
        <div class="row-actions" style="flex-wrap: wrap;">
          <button
            v-if="row.status === 'pending'"
            type="button"
            class="campus-btn"
            @click="apps.setStatus(row.id, 'ready')"
          >
            Marcar listo
          </button>
          <button
            v-if="row.status === 'ready'"
            type="button"
            class="campus-btn"
            @click="apps.setStatus(row.id, 'pending')"
          >
            Pasar a duda
          </button>
          <button
            v-if="row.status === 'ready' || row.status === 'pending'"
            type="button"
            class="campus-btn"
            @click="apps.setStatus(row.id, 'rejected')"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showImport"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-excel-title"
      @click.self="showImport = false"
    >
      <div class="modal-card">
        <h2 id="import-excel-title">Importar Excel de inscriptos</h2>
        <p class="modal-hint">
          Detecta filas verdes (listos) y naranjas (en duda). Columnas: nombre, email, WhatsApp, audiencia, desafío, rol, ocupación, ciudad.
        </p>
        <label for="import-course">Curso destino</label>
        <select id="import-course" v-model="importCourseId" required>
          <option disabled value="">Seleccionar curso</option>
          <option v-for="course in admin.courses" :key="course.id" :value="course.id">
            {{ course.title }}
          </option>
        </select>
        <label for="import-file">Archivo .xlsx</label>
        <input
          id="import-file"
          ref="fileInput"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          @change="onPickFile"
        >
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showImport = false">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 44, 84, 0.45);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 20px;
}
.modal-card {
  width: min(480px, 100%);
  background: var(--eg-surface);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(13, 44, 84, 0.2);
}
.modal-card h2 { margin: 0 0 12px; font-family: var(--eg-font-display); }
.modal-card label { display: block; margin: 12px 0 6px; font-size: 13px; font-weight: 700; }
.modal-card select, .modal-card input[type="file"] {
  width: 100%; box-sizing: border-box; padding: 12px;
  border: 1px solid var(--eg-field-border); border-radius: 10px; font-family: inherit;
}
.modal-hint { font-size: 13px; color: var(--eg-muted); margin: 0 0 8px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; }
.btn-secondary {
  border: none; border-radius: 9px; padding: 11px 18px; font-weight: 700; cursor: pointer;
  background: var(--eg-row-bg); color: var(--eg-ink); font-family: inherit;
}
</style>
