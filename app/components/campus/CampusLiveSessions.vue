<script setup lang="ts">
import type { LiveSession } from '~/types/commerce'
import { MEETING_PROVIDER_LABELS } from '~/types/commerce'

withDefaults(defineProps<{
  sessions: LiveSession[]
  title?: string
  showEmpty?: boolean
}>(), {
  showEmpty: true,
})

function providerLabel(provider: string) {
  return MEETING_PROVIDER_LABELS[provider as keyof typeof MEETING_PROVIDER_LABELS] ?? provider
}

function formatDate(value: string, time: string | null) {
  const date = new Date(value)
  const formatted = date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return time ? `${formatted} · ${time.slice(0, 5)}` : formatted
}
</script>

<template>
  <section class="live-section">
    <div class="section-heading">
      <span class="section-label">EN VIVO</span>
      <h2>{{ title || 'Próximas clases en vivo' }}</h2>
    </div>

    <p v-if="!sessions.length && showEmpty" class="empty-copy">
      No hay clases en vivo programadas por ahora. Te avisaremos cuando haya una nueva sesión.
    </p>

    <div v-else class="session-list">
      <article v-for="session in sessions" :key="session.id" class="session-card">
        <div>
          <strong>{{ session.title }}</strong>
          <p>{{ session.course_title }}</p>
          <small>{{ formatDate(session.session_date, session.start_time) }} · {{ providerLabel(session.meeting_provider) }}</small>
        </div>
        <a
          v-if="session.meeting_url"
          :href="session.meeting_url"
          target="_blank"
          rel="noopener noreferrer"
          class="join-btn"
        >
          Unirse →
        </a>
        <span v-else class="pending-link">Link pendiente</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.live-section {
  margin-bottom: 28px;
}

.section-label {
  color: var(--eg-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
}

.section-heading h2 {
  margin: 8px 0 16px;
  font-family: var(--eg-font-display);
}

.empty-copy {
  color: var(--eg-subtle);
  margin: 0;
  line-height: 1.6;
}

.session-list {
  display: grid;
  gap: 12px;
}

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 14px;
  background: var(--eg-surface);
  border: 1px solid var(--eg-border);
}

.session-card p {
  margin: 4px 0;
  color: var(--eg-ink-soft);
}

.session-card small {
  color: var(--eg-subtle);
}

.join-btn {
  text-decoration: none;
  background: var(--eg-action);
  color: var(--eg-surface);
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 700;
  white-space: nowrap;
}

.pending-link {
  color: var(--eg-subtle);
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .session-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
