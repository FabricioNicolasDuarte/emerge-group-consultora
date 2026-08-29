<script setup lang="ts">
import type { AdminCertificate } from '~/types/commerce'
import type { RecentEnrollment } from '~/types/academic'
import { formatSupabaseError } from '~/utils/supabase-error'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador'],
  campusNav: {
    panel: 'admin',
    group: 'Certificaciones',
    label: 'Certificados',
    icon: 'descargas',
    order: 1,
  },
})

const user = useSupabaseUser()
const { fetchRecentEnrollments } = useAcademic()
const { fetchAdminCertificates, issueCertificateManual } = useCampusCommerce()

const certificates = ref<AdminCertificate[]>([])
const enrollments = ref<RecentEnrollment[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const selectedEnrollmentId = ref('')
const certSearch = ref('')

async function loadData() {
  if (!user.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const [certRows, enrollmentRows] = await Promise.all([
      fetchAdminCertificates(),
      fetchRecentEnrollments(),
    ])
    certificates.value = certRows
    enrollments.value = enrollmentRows
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'Error al cargar certificados')
  } finally {
    loading.value = false
  }
}

const eligibleEnrollments = computed(() =>
  enrollments.value.filter((row) =>
    row.progress_percent >= 100
    && !certificates.value.some((cert) => cert.enrollment_id === row.id),
  ),
)

const filteredCertificates = computed(() => {
  const q = certSearch.value.trim().toLowerCase()
  if (!q) return certificates.value
  return certificates.value.filter((cert) =>
    cert.student_name.toLowerCase().includes(q)
    || cert.course_title.toLowerCase().includes(q)
    || cert.certificate_code.toLowerCase().includes(q),
  )
})

async function onIssueManual() {
  if (!selectedEnrollmentId.value) return
  saving.value = true
  try {
    await issueCertificateManual(selectedEnrollmentId.value)
    selectedEnrollmentId.value = ''
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo emitir el certificado')
  } finally {
    saving.value = false
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR')
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

useCampusAutoRefresh(loadData)
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="CERTIFICACIONES"
      title="Certificados emitidos"
      description="Gestioná certificados automáticos y emisiones manuales para participantes que completaron el programa."
    />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="campus-banner">Cargando…</p>

    <section v-if="!loading" class="campus-admin-panel campus-card">
      <h2>Emisión manual</h2>
      <p class="campus-admin-hint">Para inscripciones al 100% que aún no tienen certificado.</p>
      <div class="campus-form-row">
        <select v-model="selectedEnrollmentId">
          <option value="">Elegir inscripción completada</option>
          <option v-for="row in eligibleEnrollments" :key="row.id" :value="row.id">
            {{ row.student_name }} — {{ row.course_title }} ({{ row.progress_percent }}%)
          </option>
        </select>
        <button type="button" class="campus-btn campus-btn--primary" :disabled="saving || !selectedEnrollmentId" @click="onIssueManual">
          Emitir certificado
        </button>
      </div>
    </section>

    <section v-if="!loading" class="campus-admin-panel campus-card">
      <h2>Certificados del campus</h2>
      <div class="table-toolbar">
        <input v-model="certSearch" type="search" placeholder="Buscar por alumno, curso o código…" class="table-search" aria-label="Buscar certificado">
      </div>
      <p v-if="!filteredCertificates.length" class="campus-admin-empty">No hay certificados que coincidan con la búsqueda.</p>

      <div v-else class="campus-data-table">
        <div class="campus-data-row campus-data-row--certificates campus-data-row--header">
          <span>Alumno</span>
          <span>Curso</span>
          <span>Código</span>
          <span>Emitido</span>
          <span>Acción</span>
        </div>
        <div v-for="row in filteredCertificates" :key="row.id" class="campus-data-row campus-data-row--certificates">
          <div>
            <strong>{{ row.student_name }}</strong>
            <small>{{ row.student_email }}</small>
          </div>
          <span>{{ row.course_title }}</span>
          <span class="campus-data-code">{{ row.certificate_code }}</span>
          <span>{{ formatDate(row.issued_at) }}</span>
          <NuxtLink :to="`/campus/certificados/${row.certificate_code}`" target="_blank" class="campus-data-link">
            Ver →
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
