<script setup lang="ts">
import { formatCoursePrice } from '~/types/commerce'

definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['superadmin', 'admin', 'coordinador'],
  campusNav: {
    panel: 'admin',
    group: 'General',
    label: 'Cursos',
    icon: 'misCursos',
    order: 2,
  },
})

const admin = useAdminCampusData()
</script>

<template>
  <div>
    <CampusPageHeader eyebrow="FORMACIÓN" title="Cursos">
      <template #actions>
        <button type="button" class="campus-btn campus-btn--primary" @click="admin.showCourseForm = true">+ Nuevo curso</button>
      </template>
    </CampusPageHeader>

    <div class="table-toolbar">
      <input v-model="admin.courseSearch" type="search" placeholder="Buscar curso…" class="table-search" aria-label="Buscar curso">
    </div>

    <div class="table-card campus-card">
      <div class="table-row table-row--courses table-header">
        <span>Curso</span><span>Alumnos</span><span>Estado</span><span>Acciones</span>
      </div>
      <div v-if="!admin.courses.length && !admin.loading" class="table-empty">No hay cursos cargados.</div>
      <div v-for="course in admin.filteredCourses" :key="course.id" class="table-row table-row--courses">
        <div>
          <strong>{{ course.title }}</strong>
          <small>{{ course.module_count }} módulos · {{ course.category }} · {{ formatCoursePrice(course.price_amount ?? 0, course.price_currency ?? 'ARS') }}</small>
        </div>
        <span>{{ course.enrollment_count }}</span>
        <span class="status" :class="course.status === 'published' ? 'active' : 'draft'">{{ admin.statusLabel(course.status) }}</span>
        <div class="row-actions">
          <NuxtLink :to="`/campus/admin/cursos/${course.id}/contenido`" class="table-link">Contenido</NuxtLink>
          <NuxtLink :to="`/campus/admin/cursos/${course.id}/asistencia`" class="table-link">Asistencia</NuxtLink>
          <NuxtLink :to="`/campus/admin/cursos/${course.id}/calificaciones`" class="table-link">Notas</NuxtLink>
          <button type="button" class="campus-btn" @click="admin.openCohortForm(course)">Cohorte</button>
          <button type="button" class="campus-btn" @click="admin.openPriceForm(course)">Precio</button>
          <button type="button" class="campus-btn" @click="admin.openTeacherForm(course)">Docente</button>
          <button type="button" class="campus-btn" @click="admin.togglePublish(course)">{{ course.status === 'published' ? 'Ocultar' : 'Publicar' }}</button>
        </div>
      </div>
    </div>

    <AdminCampusModals />
  </div>
</template>
