<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  to: string
  cta?: string
}>()
</script>

<template>
  <section class="section-preview campus-card">
    <div>
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
      <slot />
    </div>
    <NuxtLink :to="to" class="section-preview__link">
      {{ cta || 'Ver sección →' }}
    </NuxtLink>
  </section>
</template>

<style scoped>
.section-preview {
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-preview h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  color: var(--campus-ink);
}

.section-preview p {
  margin: 0;
  color: var(--campus-muted);
  font-size: 0.86rem;
}

.section-preview__link {
  flex-shrink: 0;
  color: var(--eg-action);
  font-weight: 700;
  font-size: 0.84rem;
  text-decoration: none;
  white-space: nowrap;
}

.section-preview__link:hover {
  text-decoration: underline;
}
</style>
