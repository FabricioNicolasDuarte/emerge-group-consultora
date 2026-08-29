<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['superadmin', 'admin', 'coordinador'],
  campusNav: {
    panel: 'admin',
    group: 'General',
    label: 'Inicio',
    icon: 'inicio',
    exact: true,
    order: 1,
  },
})

const admin = useAdminCampusData()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="PANEL ADMINISTRATIVO"
      title="Gestión del Campus"
      description="Panorama general de cursos, participantes e inscripciones."
    />

    <p v-if="admin.errorMessage" class="form-banner error">{{ admin.errorMessage }}</p>
    <p v-if="admin.successMessage" class="form-banner success">{{ admin.successMessage }}</p>
    <p v-if="!admin.paymentsEnabled && !admin.loading" class="form-banner info">
      Pagos online deshabilitados. Usá precio <strong>0</strong> para inscripción automática gratuita.
    </p>

    <CampusRoleSwitcher />

    <section v-if="!admin.loading" class="kpi-grid campus-section">
      <CampusKpiCard label="Cursos activos" :value="admin.stats.publishedCourses" hint="Publicados" />
      <CampusKpiCard label="Alumnos" :value="admin.stats.totalStudents" hint="Registrados" />
      <CampusKpiCard label="Inscripciones" :value="admin.stats.activeEnrollments" hint="Activas" accent />
      <CampusKpiCard label="Cursos totales" :value="admin.courses.length" hint="Incluye borradores" />
    </section>

    <section class="campus-section">
      <div class="preview-grid">
        <div class="preview-card campus-card">
          <h3>Top cursos por inscriptos</h3>
          <CampusMiniBarChart v-if="admin.enrollmentChartBars.length" :bars="admin.enrollmentChartBars" />
          <p v-else class="muted">Sin datos de inscripciones.</p>
        </div>
        <div class="preview-card campus-card">
          <h3>Indicadores</h3>
          <CampusMiniBarChart
            :bars="[
              { label: 'Progreso prom.', value: admin.avgEnrollmentProgress },
              { label: 'Completados', value: admin.completedEnrollments.length },
            ]"
            :max="100"
          />
        </div>
      </div>
      <div class="preview-links">
        <CampusSectionPreview title="Cursos" :description="`${admin.courses.length} en total`" to="/campus/admin/cursos" />
        <CampusSectionPreview title="Alumnos" :description="`${admin.students.length} registrados`" to="/campus/admin/alumnos" />
        <CampusSectionPreview title="Inscripciones" :description="`${admin.recentEnrollments.length} recientes`" to="/campus/admin/inscripciones" />
        <CampusSectionPreview title="Reportes" description="Análisis completo" to="/campus/admin/reportes" />
      </div>
    </section>

    <section class="campus-section quick-actions">
      <button type="button" class="campus-btn campus-btn--primary" @click="admin.showCourseForm = true">Crear curso</button>
      <button type="button" class="campus-btn" @click="admin.showEnrollmentForm = true">Nueva inscripción</button>
    </section>

    <AdminCampusModals />
  </div>
</template>

<style scoped>
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
.preview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem; }
.preview-card { padding: 1.1rem 1.25rem; }
.preview-card h3 { margin: 0 0 0.75rem; font-size: 0.95rem; }
.preview-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
.quick-actions { display: flex; gap: 0.65rem; flex-wrap: wrap; }
.muted { color: var(--campus-muted); margin: 0; }
.form-banner { margin-bottom: 1rem; padding: 0.7rem 1rem; border-radius: 10px; font-size: 0.88rem; background: var(--eg-info-bg); }
.form-banner.error { background: var(--eg-error-bg); color: var(--eg-error); }
.form-banner.success { background: var(--eg-success-bg); color: var(--eg-success); }
.form-banner.info { background: var(--eg-accent-bg); color: var(--eg-ink-soft); }
@media (max-width: 900px) { .kpi-grid, .preview-grid, .preview-links { grid-template-columns: 1fr; } }
</style>
