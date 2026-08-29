<script setup lang="ts">
const {
  buzonPath,
  redactarPath,
  anunciosPath,
  canComposeMailbox,
  canManageAnnouncements,
} = useCampusCommsPaths()
</script>

<template>
  <div class="comms-hub campus-page">
    <CampusPageHeader
      eyebrow="CENTRO DE COMUNICACIÓN"
      title="Comunicaciones"
      description="Avisos del campus, alertas del sistema y mensajes internos en un solo lugar."
    />

    <div class="hub-grid">
      <NuxtLink :to="buzonPath" class="hub-card">
        <span class="icon">✉</span>
        <h2>Mi buzón</h2>
        <p>Mensajes directos, alertas y respuestas entre usuarios del campus.</p>
        <strong>Abrir buzón <CampusMailboxBadge placement="inline" /> →</strong>
      </NuxtLink>

      <NuxtLink v-if="canComposeMailbox" :to="redactarPath" class="hub-card">
        <span class="icon">✎</span>
        <h2>Redactar mensaje</h2>
        <p>Enviá mensajes o alertas a alumnos, docentes o equipo administrativo.</p>
        <strong>Redactar →</strong>
      </NuxtLink>

      <NuxtLink v-if="canManageAnnouncements" :to="anunciosPath" class="hub-card featured">
        <span class="icon">🎨</span>
        <h2>Editor de anuncios</h2>
        <p>Diseñá avisos con colores, tipografías, íconos, imágenes y videos.</p>
        <strong>Ir al editor →</strong>
      </NuxtLink>
    </div>

    <section class="feed-section">
      <CampusCommsWidget />
    </section>
  </div>
</template>

<style scoped>
.hub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 2rem;
}

.hub-card {
  background: var(--eg-surface);
  border-radius: 18px;
  padding: 28px;
  border: 1px solid var(--eg-border);
  text-decoration: none;
  color: inherit;
  display: grid;
  gap: 10px;
  transition: transform 0.2s ease;
}

.hub-card:hover {
  transform: translateY(-3px);
}

.hub-card.featured {
  border-color: rgba(242, 140, 40, 0.45);
  background: linear-gradient(180deg, var(--eg-surface), #fff9f3);
}

.icon { font-size: 28px; }

.hub-card h2 {
  margin: 0;
  font-family: var(--eg-font-display);
}

.hub-card p {
  color: var(--eg-muted);
  line-height: 1.6;
  margin: 0;
}

.hub-card strong {
  color: var(--eg-action);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.feed-section {
  padding-top: 0.5rem;
}

@media (max-width: 900px) {
  .hub-grid { grid-template-columns: 1fr; }
}
</style>
