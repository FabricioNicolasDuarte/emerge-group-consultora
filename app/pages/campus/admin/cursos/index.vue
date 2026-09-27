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
        <button type="button" class="campus-btn campus-btn--primary" @click="admin.openCreateCourse()">+ Nuevo curso</button>
      </template>
    </CampusPageHeader>

    <p v-if="admin.errorMessage" class="campus-banner campus-banner--error">{{ admin.errorMessage }}</p>
    <p v-if="admin.successMessage" class="campus-banner campus-banner--success">{{ admin.successMessage }}</p>

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
        <div class="row-actions row-actions--icons">
          <CampusAdminCampusTableIconBtn
            icon="mdi:book-open-page-variant-outline"
            label="Contenido"
            :to="`/campus/admin/cursos/${course.id}/contenido`"
          />
          <CampusAdminCampusTableIconBtn
            icon="mdi:calendar-check-outline"
            label="Asistencia"
            :to="`/campus/admin/cursos/${course.id}/asistencia`"
          />
          <CampusAdminCampusTableIconBtn
            icon="mdi:clipboard-text-outline"
            label="Notas"
            :to="`/campus/admin/cursos/${course.id}/calificaciones`"
          />
          <CampusAdminCampusTableIconBtn
            icon="mdi:calendar-range"
            label="Cohorte"
            :disabled="admin.formLoading"
            @click="admin.openCohortForm(course)"
          />
          <CampusAdminCampusTableIconBtn
            icon="mdi:currency-usd"
            label="Precio"
            :disabled="admin.formLoading"
            @click="admin.openPriceForm(course)"
          />
          <CampusAdminCampusTableIconBtn
            icon="mdi:account-tie-outline"
            label="Docente"
            :disabled="admin.formLoading"
            @click="admin.openTeacherForm(course)"
          />
          <CampusAdminCampusTableIconBtn
            :icon="course.status === 'published' ? 'mdi:eye-off-outline' : 'mdi:eye-outline'"
            :label="course.status === 'published' ? 'Ocultar' : 'Publicar'"
            :disabled="admin.formLoading"
            @click="admin.togglePublish(course)"
          />
          <template v-if="admin.isSuperadmin">
            <CampusAdminCampusTableIconBtn
              icon="mdi:pencil-outline"
              label="Editar curso"
              :disabled="admin.formLoading"
              @click="admin.openEditCourse(course)"
            />
            <CampusAdminCampusTableIconBtn
              icon="mdi:trash-can-outline"
              label="Eliminar curso"
              danger
              :disabled="admin.formLoading"
              @click="admin.onDeleteCourse(course)"
            />
          </template>
        </div>
      </div>
    </div>

    <CampusAdminCampusModals />
  </div>
</template>
