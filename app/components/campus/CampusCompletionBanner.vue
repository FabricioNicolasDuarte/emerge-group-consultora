<script setup lang="ts">
defineProps<{
  courseTitle: string
  certificateCode?: string | null
}>()
</script>

<template>
  <aside class="completion-banner">
    <div>
      <span class="badge">¡Programa completado!</span>
      <h3>{{ courseTitle }}</h3>
      <p>Completaste el 100% del programa. Tu certificado ya está disponible.</p>
    </div>
    <NuxtLink
      v-if="certificateCode"
      :to="`/campus/certificados/${certificateCode}`"
      class="cta"
    >
      Ver certificado →
    </NuxtLink>
    <NuxtLink v-else to="/campus/student#certificados" class="cta">
      Ir a mis certificados →
    </NuxtLink>
  </aside>
</template>

<style scoped>
.completion-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 22px 24px;
  margin-bottom: 28px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--eg-success-bg), var(--eg-success-border));
  border: 1px solid var(--eg-success-border);
  color: var(--eg-success);
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--eg-success);
  margin-bottom: 6px;
}

h3 {
  margin: 0 0 6px;
  font-family: var(--eg-font-display);
  font-size: 22px;
}

p {
  margin: 0;
  color: var(--eg-success);
  line-height: 1.5;
}

.cta {
  white-space: nowrap;
  background: var(--eg-success);
  color: var(--eg-surface);
  padding: 12px 16px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 768px) {
  .completion-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
