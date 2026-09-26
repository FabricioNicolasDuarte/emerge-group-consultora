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
    <CampusPageHeader eyebrow="PARTICIPANTES" title="Alumnos registrados" description="Alta manual con ficha completa, o importá el Excel desde Solicitudes.">
      <template #actions>
        <NuxtLink to="/campus/admin/solicitudes" class="campus-btn">Importar Excel</NuxtLink>
        <button type="button" class="campus-btn" @click="admin.showStudentForm = true">+ Nuevo alumno</button>
        <button type="button" class="campus-btn campus-btn--primary" @click="admin.showEnrollmentForm = true">+ Nueva inscripción</button>
      </template>
    </CampusPageHeader>

    <p v-if="admin.errorMessage" class="campus-banner campus-banner--error">{{ admin.errorMessage }}</p>
    <p v-if="admin.successMessage" class="campus-banner campus-banner--success">{{ admin.successMessage }}</p>

    <div class="table-toolbar">
      <input v-model="admin.studentSearch" type="search" placeholder="Buscar nombre, email, ciudad, rol…" class="table-search" aria-label="Buscar alumno">
    </div>

    <div class="table-card campus-card">
      <div class="table-row table-row--students-admin table-header">
        <span>Alumno</span><span>Contacto</span><span>Rol / Ciudad</span><span>Inscripciones</span><span>Acción</span>
      </div>
      <div v-if="!admin.students.length && !admin.loading" class="table-empty">No hay alumnos registrados.</div>
      <div
        v-for="student in admin.filteredStudents"
        :key="student.id"
        class="table-row table-row--students-admin"
      >
        <div>
          <strong>{{ student.full_name }}</strong>
          <small v-if="student.audience" style="display:block; opacity:0.75;">{{ student.audience }}</small>
        </div>
        <div>
          <span>{{ student.email || '—' }}</span>
          <small v-if="student.phone" style="display:block;">{{ student.phone }}</small>
        </div>
        <div>
          <span>{{ student.job_role || '—' }}</span>
          <small style="display:block;">{{ [student.occupation, student.city].filter(Boolean).join(' · ') || '—' }}</small>
        </div>
        <strong class="table-accent">{{ admin.studentEnrollmentCounts[student.id] ?? 0 }}</strong>
        <button type="button" class="table-action-btn" @click="admin.newEnrollment.student_id = student.id; admin.showEnrollmentForm = true">Inscribir</button>
      </div>
    </div>

    <CampusAdminCampusModals />
  </div>
</template>
