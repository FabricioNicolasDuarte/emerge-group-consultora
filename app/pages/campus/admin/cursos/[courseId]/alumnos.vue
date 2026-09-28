<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor'],
  alias: ['/campus/teacher/cursos/:courseId/alumnos'],
})

const route = useRoute()
const courseId = computed(() => route.params.courseId as string)
const { panelPath, panelLabel } = useCampusBackLink()
const { comunicacionesPath } = useCampusStaffPaths()

const { fetchCourseById } = useCourseContent()
const { fetchCourseStudents } = useCourseTracking()

const course = ref<Awaited<ReturnType<typeof fetchCourseById>>>(null)
const students = ref<{ id: string, full_name: string, email: string | null }[]>([])
const loading = ref(true)
const errorMessage = ref('')
const query = ref('')

const filteredStudents = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return students.value
  return students.value.filter((s) =>
    s.full_name.toLowerCase().includes(q)
    || (s.email ?? '').toLowerCase().includes(q),
  )
})

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    course.value = await fetchCourseById(courseId.value)
    if (!course.value) {
      errorMessage.value = 'Curso no encontrado.'
      return
    }
    students.value = await fetchCourseStudents(courseId.value)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al cargar alumnos'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <NuxtLink :to="panelPath" class="panel-back">← Volver a {{ panelLabel }}</NuxtLink>
    <CampusPageHeader
      eyebrow="ALUMNOS DEL CURSO"
      :title="course?.title || 'Cargando…'"
      :description="course ? 'Inscriptos activos en este programa.' : undefined"
    >
      <template #actions>
        <NuxtLink :to="comunicacionesPath" class="campus-btn">
          Comunicaciones →
        </NuxtLink>
      </template>
    </CampusPageHeader>

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="alumnos" />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="campus-banner">Cargando alumnos…</p>

    <section v-if="!loading && course" class="campus-admin-panel campus-card">
      <div class="campus-inline-form">
        <input
          v-model="query"
          type="search"
          placeholder="Buscar por nombre o correo"
          aria-label="Buscar alumnos"
        >
        <span class="course-alumnos-count">{{ filteredStudents.length }} de {{ students.length }}</span>
      </div>

      <p v-if="!students.length" class="campus-admin-empty">
        No hay alumnos inscriptos en este curso.
      </p>

      <div v-else class="table-wrap">
        <table class="campus-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.id">
              <td>{{ student.full_name }}</td>
              <td>
                <a v-if="student.email" :href="`mailto:${student.email}`">{{ student.email }}</a>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.course-alumnos-count {
  align-self: center;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--eg-ink-soft);
  white-space: nowrap;
}

.table-wrap {
  overflow-x: auto;
  margin-top: 1rem;
}
</style>
