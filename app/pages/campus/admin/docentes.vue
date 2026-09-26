<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['superadmin', 'admin', 'coordinador'],
  campusNav: {
    panel: 'admin',
    group: 'General',
    label: 'Docentes',
    icon: 'progreso',
    order: 3.5,
  },
})

const admin = useAdminCampusData()

function coursesFor(teacherId: string) {
  return admin.assignmentsByTeacher[teacherId] ?? []
}
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="EQUIPO"
      title="Docentes y tutores"
      description="Asigná cursos a cada docente. También podés hacerlo desde Cursos → Docente."
    >
      <template #actions>
        <button type="button" class="campus-btn campus-btn--primary" @click="admin.showTeacherUserForm = true">
          + Nuevo docente
        </button>
      </template>
    </CampusPageHeader>

    <p v-if="admin.errorMessage" class="campus-banner campus-banner--error">{{ admin.errorMessage }}</p>
    <p v-if="admin.successMessage" class="campus-banner campus-banner--success">{{ admin.successMessage }}</p>

    <div class="table-toolbar">
      <input
        v-model="admin.teacherSearch"
        type="search"
        placeholder="Buscar nombre o correo…"
        class="table-search"
        aria-label="Buscar docente"
      >
    </div>

    <div class="table-card campus-card">
      <div class="table-row table-row--teachers table-header">
        <span>Docente</span>
        <span>Cursos asignados</span>
        <span>Acción</span>
      </div>
      <div v-if="!admin.teachers.length && !admin.loading" class="table-empty">
        No hay usuarios con rol docente o tutor. Creá uno con “+ Nuevo docente”.
      </div>
      <div
        v-for="teacher in admin.filteredTeachers"
        :key="teacher.id"
        class="table-row table-row--teachers"
      >
        <div>
          <strong>{{ teacher.full_name }}</strong>
          <small style="display:block; opacity:0.75;">{{ teacher.email || '—' }}</small>
        </div>
        <div class="teacher-courses">
          <template v-if="coursesFor(teacher.id).length">
            <span
              v-for="assignment in coursesFor(teacher.id)"
              :key="assignment.id"
              class="teacher-course-chip"
            >
              <span>{{ assignment.course_title }}</span>
              <small>{{ assignment.role }}</small>
              <button
                type="button"
                class="teacher-course-chip__remove"
                :title="`Quitar de ${assignment.course_title}`"
                :aria-label="`Quitar ${assignment.course_title}`"
                :disabled="admin.formLoading"
                @click="admin.onUnassignTeacher(assignment.id)"
              >
                ×
              </button>
            </span>
          </template>
          <span v-else class="muted">Sin cursos</span>
        </div>
        <button
          type="button"
          class="table-action-btn"
          @click="admin.openAssignCourseForm(teacher)"
        >
          Asignar curso
        </button>
      </div>
    </div>

    <CampusAdminCampusModals />
  </div>
</template>

<style scoped>
.teacher-courses {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.teacher-course-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.45rem 0.25rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--eg-border, #d7dee8);
  background: var(--eg-bg, #f6f8fb);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--eg-ink, #0d2c54);
}

.teacher-course-chip small {
  font-weight: 600;
  opacity: 0.65;
  text-transform: capitalize;
}

.teacher-course-chip__remove {
  border: none;
  background: transparent;
  color: var(--eg-muted, #66768a);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.15rem;
}

.teacher-course-chip__remove:hover {
  color: var(--eg-error, #b42318);
}

.muted {
  color: var(--campus-muted, #66768a);
  font-size: 0.85rem;
}
</style>
