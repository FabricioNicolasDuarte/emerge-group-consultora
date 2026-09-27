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

    <div class="table-toolbar">
      <input v-model="admin.enrollmentSearch" type="search" placeholder="Buscar inscripción…" class="table-search" aria-label="Buscar inscripción">
    </div>

    <div class="table-card campus-card">
      <div class="table-row table-row--student table-header">
        <span>Alumno</span><span>Curso</span><span>Progreso</span><span>Fecha</span>
      </div>
      <div v-if="!admin.filteredEnrollments.length && !admin.loading" class="table-empty">No hay inscripciones.</div>
      <div v-for="row in admin.filteredEnrollments" :key="`enroll-${row.id}`" class="table-row table-row--student">
        <div>
          <strong>{{ row.student_name }}</strong>
          <small>{{ row.student_email }}</small>
        </div>
        <span>{{ row.course_title }}</span>
        <strong class="table-accent">{{ row.progress_percent }}%</strong>
        <span>{{ new Date(row.enrolled_at).toLocaleDateString('es-AR') }}</span>
      </div>
    </div>

    <CampusAdminCampusModals />
  </div>
</template>
