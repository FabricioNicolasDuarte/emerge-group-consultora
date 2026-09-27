<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['superadmin', 'admin', 'coordinador'],
  campusNav: {
    panel: 'admin',
    group: 'General',
    label: 'Inscripciones',
    icon: 'pagos',
    order: 5,
  },
})

const admin = useAdminCampusData()
</script>

<template>
  <div>
    <CampusPageHeader eyebrow="INSCRIPCIONES" title="Gestión de inscripciones" description="Altas y asignación de participantes.">
      <template #actions>
        <button type="button" class="campus-btn campus-btn--primary" @click="admin.showEnrollmentForm = true">+ Nueva inscripción</button>
      </template>
    </CampusPageHeader>

    <p v-if="admin.errorMessage" class="campus-banner campus-banner--error">{{ admin.errorMessage }}</p>
    <p v-if="admin.successMessage" class="campus-banner campus-banner--success">{{ admin.successMessage }}</p>

    <div class="table-toolbar">
      <input v-model="admin.enrollmentSearch" type="search" placeholder="Buscar inscripción…" class="table-search" aria-label="Buscar inscripción">
    </div>

    <div class="table-card campus-card">
      <div class="table-row table-row--enrollments-admin table-header">
        <span>Alumno</span><span>Curso</span><span>Progreso</span><span>Fecha</span><span>Acciones</span>
      </div>
      <div v-if="!admin.filteredEnrollments.length && !admin.loading" class="table-empty">No hay inscripciones.</div>
      <div v-for="row in admin.filteredEnrollments" :key="`enroll-${row.id}`" class="table-row table-row--enrollments-admin">
        <div>
          <strong>{{ row.student_name }}</strong>
          <small>{{ row.student_email }}</small>
        </div>
        <span>{{ row.course_title }}</span>
        <strong class="table-accent">{{ row.progress_percent }}%</strong>
        <span>{{ new Date(row.enrolled_at).toLocaleDateString('es-AR') }}</span>
        <div class="row-actions row-actions--icons">
          <CampusAdminCampusTableIconBtn
            v-if="admin.isSuperadmin"
            icon="mdi:trash-can-outline"
            label="Eliminar inscripción"
            danger
            :disabled="admin.formLoading"
            @click="admin.onDeleteEnrollment(row)"
          />
          <span v-else class="muted">—</span>
        </div>
      </div>
    </div>

    <CampusAdminCampusModals />
  </div>
</template>
