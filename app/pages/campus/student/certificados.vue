<script setup lang="ts">
definePageMeta({
  layout: 'campus-panel',
  middleware: 'campus-role',
  campusRoles: ['alumno'],
  campusNav: {
    panel: 'student',
    group: 'Progreso',
    label: 'Certificados',
    icon: 'descargas',
    order: 2,
  },
})

const { certificates, completedCourses, loading } = useStudentCampusData()
</script>

<template>
  <div>
    <CampusPageHeader
      eyebrow="LOGROS"
      title="Mis certificados"
      description="Certificaciones obtenidas al completar tus programas."
    />

    <p v-if="!certificates.length && !loading" class="empty-copy">
      Completá un programa al 100% para obtener tu certificado automáticamente.
      <NuxtLink v-if="completedCourses.length" to="/campus/student/progreso" class="empty-cta">
        Tenés {{ completedCourses.length }} programa(s) completado(s).
      </NuxtLink>
    </p>

    <div v-for="cert in certificates" :key="cert.id" class="certificate-card">
      <div class="certificate-icon">✓</div>
      <div>
        <h3>{{ cert.course_title }}</h3>
        <p>Certificación obtenida · {{ new Date(cert.issued_at).toLocaleDateString('es-AR') }}</p>
      </div>
      <NuxtLink :to="`/campus/certificados/${cert.certificate_code}`" class="cert-link">
        Ver certificado
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.certificate-card h3 {
  margin: 0 0 0.25rem;
}
.certificate-card p {
  margin: 0;
  color: var(--campus-muted);
}
</style>
