<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['superadmin', 'admin', 'coordinador'],
  campusNav: {
    panel: 'admin',
    group: 'General',
    label: 'Alumnos',
    icon: 'progreso',
    order: 3,
  },
})

const admin = useAdminCampusData()
</script>

<template>
  <div>
    <CampusPageHeader eyebrow="PARTICIPANTES" title="Alumnos registrados" description="Usuarios con rol alumno en el campus.">
      <template #actions>
        <button type="button" class="campus-btn campus-btn--primary" @click="admin.showEnrollmentForm = true">+ Nueva inscripción</button>
      </template>
    </CampusPageHeader>

    <div class="table-toolbar">
      <input v-model="admin.studentSearch" type="search" placeholder="Buscar alumno…" class="table-search" aria-label="Buscar alumno">
    </div>

    <div class="table-card campus-card">
      <div class="table-row table-row--students-admin table-header">
        <span>Alumno</span><span>Correo</span><span>Inscripciones</span><span>Acción</span>
      </div>
      <div v-if="!admin.students.length && !admin.loading" class="table-empty">No hay alumnos registrados.</div>
      <div v-for="student in admin.filteredStudents" :key="student.id" class="table-row table-row--students-admin">
        <div><strong>{{ student.full_name }}</strong></div>
        <span>{{ student.email || '—' }}</span>
        <strong class="table-accent">{{ admin.studentEnrollmentCounts.get(student.id) ?? 0 }}</strong>
        <button type="button" class="table-action-btn" @click="admin.newEnrollment.student_id = student.id; admin.showEnrollmentForm = true">Inscribir</button>
      </div>
    </div>

    <AdminCampusModals />
  </div>
</template>
