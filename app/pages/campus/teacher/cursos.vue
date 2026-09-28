<script setup lang="ts">
import { Icon } from '@iconify/vue'

definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['docente', 'tutor', 'coordinador'],
  campusNav: {
    panel: 'teacher',
    group: 'Panel',
    label: 'Mis cursos',
    icon: 'misCursos',
    order: 2,
  },
})

const { courses, loading } = useTeacherCampusData()
const {
  courseHubPath,
  courseContenidoPath,
  courseAlumnosPath,
  courseAsistenciaPath,
  courseCalificacionesPath,
} = useCampusStaffPaths()
</script>

<template>
  <div class="campus-mgmt-ambient">
    <CampusPageHeader
      eyebrow="MIS PROGRAMAS"
      title="Cursos asignados"
      description="Gestioná cada programa desde tarjetas: contenido, alumnos, asistencia y notas."
    />

    <p v-if="loading" class="mgmt-empty campus-glass">Cargando cursos…</p>
    <p v-else-if="!courses.length" class="mgmt-empty campus-glass">
      Todavía no tenés cursos asignados. Pedí a administración que te asigne como docente.
    </p>

    <div v-else class="mgmt-course-grid">
      <article
        v-for="course in courses"
        :key="course.assignment_id"
        class="mgmt-course-card campus-glass"
      >
        <div class="mgmt-course-card__media">
          <span class="mgmt-course-card__badge">{{ course.category || 'Programa' }}</span>
          <strong style="font-size: 1.05rem; line-height: 1.25;">{{ course.title }}</strong>
        </div>
        <div class="mgmt-course-card__body">
          <p>{{ course.description || 'Sin descripción.' }}</p>
          <div class="mgmt-course-card__meta">
            <Icon icon="mdi:account-group-outline" width="16" height="16" aria-hidden="true" />
            {{ course.enrollment_count }} alumnos
          </div>
          <div class="mgmt-course-card__actions">
            <CampusAdminCampusTableIconBtn
              icon="mdi:view-dashboard-outline"
              label="Abrir curso"
              :to="courseHubPath(course.course_id)"
            />
            <CampusAdminCampusTableIconBtn
              icon="mdi:play-box-multiple-outline"
              label="Contenido"
              :to="courseContenidoPath(course.course_id)"
            />
            <CampusAdminCampusTableIconBtn
              icon="mdi:account-group-outline"
              label="Alumnos"
              :to="courseAlumnosPath(course.course_id)"
            />
            <CampusAdminCampusTableIconBtn
              icon="mdi:calendar-check-outline"
              label="Asistencia"
              :to="courseAsistenciaPath(course.course_id)"
            />
            <CampusAdminCampusTableIconBtn
              icon="mdi:clipboard-text-outline"
              label="Notas"
              :to="courseCalificacionesPath(course.course_id)"
            />
            <CampusAdminCampusTableIconBtn
              icon="mdi:eye-outline"
              label="Vista alumno"
              :to="`/campus/cursos/${course.slug}`"
            />
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
