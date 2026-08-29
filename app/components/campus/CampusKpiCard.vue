<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
  accent?: boolean
}>()
</script>

<template>
  <article class="campus-kpi campus-card" :class="{ 'campus-kpi--accent': accent }">
    <span class="campus-kpi__label">{{ label }}</span>
    <strong class="campus-kpi__value">{{ value }}</strong>
    <p v-if="hint" class="campus-kpi__hint">{{ hint }}</p>
  </article>
</template>

<style scoped>
.campus-kpi {
  padding: 1.15rem 1.25rem;
}

.campus-kpi__label {
  color: var(--campus-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.campus-kpi__value {
  display: block;
  font-size: clamp(1.6rem, 3vw, 2rem);
  color: var(--campus-ink);
  margin: 0.45rem 0 0.15rem;
  line-height: 1.1;
}

.campus-kpi__hint {
  margin: 0;
  color: var(--campus-muted);
  font-size: 0.82rem;
}

.campus-kpi--accent {
  background: linear-gradient(135deg, var(--eg-ink) 0%, var(--eg-ink-mid) 100%);
  border-color: transparent;
  color: var(--eg-surface);
}

.campus-kpi--accent .campus-kpi__label,
.campus-kpi--accent .campus-kpi__hint {
  color: rgba(255, 255, 255, 0.72);
}

.campus-kpi--accent .campus-kpi__value {
  color: var(--eg-surface);
}
</style>
