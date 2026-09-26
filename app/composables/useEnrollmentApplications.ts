import type {
  ApplicationCredential,
  ApplicationStatus,
  EnrollmentApplication,
} from '~/types/applications'
import { formatSupabaseError } from '~/utils/supabase-error'

export function useEnrollmentApplications() {
  const supabase = useSupabaseClient()

  const applications = useState<EnrollmentApplication[]>('enrollment-applications', () => [])
  const loading = useState('enrollment-applications-loading', () => false)
  const errorMessage = useState('enrollment-applications-error', () => '')
  const successMessage = useState('enrollment-applications-success', () => '')
  const lastCredentials = useState<ApplicationCredential[]>('enrollment-applications-credentials', () => [])

  const statusFilter = useState<ApplicationStatus | 'all'>('enrollment-applications-status', () => 'all')
  const courseFilter = useState<string>('enrollment-applications-course', () => '')
  const search = useState('enrollment-applications-search', () => '')
  const selectedIds = useState<string[]>('enrollment-applications-selected', () => [])

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return applications.value.filter((row) => {
      if (statusFilter.value !== 'all' && row.status !== statusFilter.value) return false
      if (courseFilter.value && row.course_id !== courseFilter.value) return false
      if (!q) return true
      return row.full_name.toLowerCase().includes(q)
        || row.email.toLowerCase().includes(q)
        || (row.city ?? '').toLowerCase().includes(q)
        || (row.phone ?? '').includes(q)
    })
  })

  const readyCount = computed(() => applications.value.filter((r) => r.status === 'ready').length)
  const pendingCount = computed(() => applications.value.filter((r) => r.status === 'pending').length)

  async function loadApplications() {
    loading.value = true
    errorMessage.value = ''
    try {
      const { data, error } = await supabase
        .from('admin_enrollment_applications')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      applications.value = (data ?? []) as EnrollmentApplication[]
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'No se pudieron cargar las solicitudes')
    } finally {
      loading.value = false
    }
  }

  async function importExcel(file: File, courseId: string) {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('courseId', courseId)
      const result = await $fetch<{
        totalRows: number
        inserted: number
        updated: number
        ready: number
        pending: number
      }>('/api/campus/admin/applications/import', {
        method: 'POST',
        body,
      })
      successMessage.value = `Importadas ${result.totalRows} filas (${result.ready} listas, ${result.pending} en duda). Nuevas: ${result.inserted}, actualizadas: ${result.updated}.`
      await loadApplications()
      return result
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'data' in error
        ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || '')
        : ''
      errorMessage.value = message || formatSupabaseError(error, 'No se pudo importar el Excel')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function convertSelected(ids?: string[]) {
    const applicationIds = ids?.length ? ids : selectedIds.value
    if (!applicationIds.length) {
      errorMessage.value = 'Seleccioná al menos una solicitud lista.'
      return null
    }
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    try {
      const result = await $fetch<{
        converted: number
        failed: number
        errors: string[]
        credentials: ApplicationCredential[]
      }>('/api/campus/admin/applications/convert', {
        method: 'POST',
        body: { applicationIds, onlyReady: true },
      })
      lastCredentials.value = result.credentials
      successMessage.value = `Convertidas ${result.converted}. Fallidas: ${result.failed}.`
      if (result.errors.length) {
        errorMessage.value = result.errors.slice(0, 5).join(' | ')
      }
      selectedIds.value = []
      await loadApplications()
      return result
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'data' in error
        ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || '')
        : ''
      errorMessage.value = message || formatSupabaseError(error, 'No se pudo convertir')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function convertAllReady(courseId: string) {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    try {
      const result = await $fetch<{
        converted: number
        failed: number
        errors: string[]
        credentials: ApplicationCredential[]
      }>('/api/campus/admin/applications/convert', {
        method: 'POST',
        body: { courseId, onlyReady: true },
      })
      lastCredentials.value = result.credentials
      successMessage.value = `Convertidas ${result.converted}. Fallidas: ${result.failed}. Descargá las contraseñas temporales.`
      if (result.errors.length) {
        errorMessage.value = result.errors.slice(0, 5).join(' | ')
      }
      await loadApplications()
      return result
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'data' in error
        ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || '')
        : ''
      errorMessage.value = message || formatSupabaseError(error, 'No se pudo convertir')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function setStatus(id: string, status: ApplicationStatus) {
    errorMessage.value = ''
    try {
      await $fetch(`/api/campus/admin/applications/${id}`, {
        method: 'PATCH',
        body: { status },
      })
      await loadApplications()
    } catch (error: unknown) {
      errorMessage.value = formatSupabaseError(error, 'No se pudo actualizar el estado')
    }
  }

  function toggleSelected(id: string) {
    if (selectedIds.value.includes(id)) {
      selectedIds.value = selectedIds.value.filter((x) => x !== id)
    } else {
      selectedIds.value = [...selectedIds.value, id]
    }
  }

  function selectAllReadyVisible() {
    selectedIds.value = filtered.value
      .filter((r) => r.status === 'ready')
      .map((r) => r.id)
  }

  function downloadCredentialsCsv() {
    if (!import.meta.client || !lastCredentials.value.length) return
    const header = 'nombre,email,contraseña_temporal,cuenta_nueva,inscrito'
    const lines = lastCredentials.value.map((row) =>
      [
        JSON.stringify(row.full_name),
        row.email,
        JSON.stringify(row.temporary_password),
        row.created ? 'si' : 'no',
        row.enrolled ? 'si' : 'no',
      ].join(','),
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `credenciales-campus-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return reactive({
    applications,
    filtered,
    loading,
    errorMessage,
    successMessage,
    lastCredentials,
    statusFilter,
    courseFilter,
    search,
    selectedIds,
    readyCount,
    pendingCount,
    loadApplications,
    importExcel,
    convertSelected,
    convertAllReady,
    setStatus,
    toggleSelected,
    selectAllReadyVisible,
    downloadCredentialsCsv,
  })
}
