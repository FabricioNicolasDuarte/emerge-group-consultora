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
const students = ref<{ id: string, full_name: string, email: string | null, avatar_url: string | null }[]>([])
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
  <div class="campus-mgmt-ambient">
    <NuxtLink :to="panelPath" class="panel-back">← Volver a {{ panelLabel }}</NuxtLink>
    <CampusPageHeader
      eyebrow="ALUMNOS DEL CURSO"
      :title="course?.title || 'Cargando…'"
      :description="course ? 'Inscriptos activos en este programa.' : undefined"
    >
      <template #actions>
        <CampusAdminCampusTableIconBtn
          icon="mdi:message-text-outline"
          label="Comunicaciones"
          :to="comunicacionesPath"
        />
      </template>
    </CampusPageHeader>

    <CampusCourseManagementNav v-if="course" :course-id="courseId" active="alumnos" />

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando alumnos…</p>

    <template v-if="!loading && course">
      <div class="mgmt-toolbar campus-glass campus-glass--soft">
        <input
          v-model="query"
          type="search"
          placeholder="Buscar por nombre o correo"
          aria-label="Buscar alumnos"
        >
        <span class="course-alumnos-count">{{ filteredStudents.length }} / {{ students.length }}</span>
      </div>

      <p v-if="!students.length" class="mgmt-empty campus-glass">
        No hay alumnos inscriptos en este curso.
      </p>

      <div v-else class="mgmt-people-grid">
        <article
          v-for="student in filteredStudents"
          :key="student.id"
          class="mgmt-person-card campus-glass"
        >
          <CampusAvatar :name="student.full_name" :src="student.avatar_url" size="md" />
          <div class="mgmt-person-card__body">
            <strong :title="student.full_name">{{ student.full_name }}</strong>
            <a
              v-if="student.email"
              :href="`mailto:${student.email}`"
              :title="student.email"
            >{{ student.email }}</a>
            <span v-else>Sin correo</span>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.course-alumnos-count {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--campus-ink-soft);
  white-space: nowrap;
}
</style>
