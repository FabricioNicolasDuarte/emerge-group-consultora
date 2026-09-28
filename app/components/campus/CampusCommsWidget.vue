<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { CampusAnnouncement, CampusNotification } from '~/types/comms'
import { NOTIFICATION_TYPE_LABELS } from '~/types/comms'
import { stripHtml } from '~/utils/sanitize-html'

const props = withDefaults(defineProps<{
  showAnnouncements?: boolean
  showNotifications?: boolean
  compact?: boolean
}>(), {
  showAnnouncements: true,
  showNotifications: true,
  compact: false,
})

const user = useSupabaseUser()
const {
  fetchCampusAnnouncements,
  fetchMyNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} = useCampusComms()
const { buzonPath } = useCampusCommsPaths()

const announcements = ref<CampusAnnouncement[]>([])
const notifications = ref<CampusNotification[]>([])
const unreadCount = ref(0)
const loading = ref(true)

const unreadNotifications = computed(() => notifications.value.filter((n) => !n.is_read))
const actionError = ref('')
const markingAll = ref(false)

async function loadData() {
  if (!user.value) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const tasks: Promise<unknown>[] = []
    if (props.showAnnouncements) tasks.push(fetchCampusAnnouncements().then((r) => { announcements.value = r }))
    if (props.showNotifications) {
      tasks.push(fetchMyNotifications().then((r) => { notifications.value = r }))
      tasks.push(fetchUnreadCount().then((r) => { unreadCount.value = r }))
    }
    await Promise.all(tasks)
  } finally {
    loading.value = false
  }
}

async function onRead(notification: CampusNotification) {
  if (!notification.is_read) {
    await markNotificationRead(notification.id)
    notification.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  if (notification.link_url) {
    await navigateToNotification(notification.link_url)
  }
}

async function navigateToNotification(link: string) {
  if (link.startsWith('/') && !link.startsWith('//')) {
    await navigateTo(link)
    return
  }
  if (link.startsWith('http://') || link.startsWith('https://')) {
    window.open(link, '_blank', 'noopener')
  }
}

async function onReadAll() {
  markingAll.value = true
  actionError.value = ''
  try {
    await markAllNotificationsRead()
    await loadData()
  } catch (error: unknown) {
    actionError.value = error instanceof Error ? error.message : 'No se pudieron marcar las notificaciones'
  } finally {
    markingAll.value = false
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function stripPreview(html?: string | null) {
  const text = stripHtml(html ?? '')
  return text.length > 160 ? `${text.slice(0, 160)}…` : text
}

onMounted(() => {
  if (user.value) {
    loadData()
    return
  }
  const stop = watch(user, (current) => {
    if (current) {
      stop()
      loadData()
    }
  }, { immediate: true })
})

defineExpose({ unreadCount, loadData })
</script>

<template>
  <div class="comms-widget" :class="{ compact }">
    <div v-if="showNotifications && unreadCount > 0 && !compact" class="comms-unread campus-glass">
      <div class="comms-unread__copy">
        <Icon icon="mdi:bell-badge-outline" width="20" height="20" aria-hidden="true" />
        <span>{{ unreadCount }} notificación{{ unreadCount === 1 ? '' : 'es' }} sin leer</span>
      </div>
      <button type="button" class="comms-text-btn" :disabled="markingAll" @click="onReadAll">
        {{ markingAll ? 'Marcando…' : 'Marcar todas leídas' }}
      </button>
    </div>

    <section v-if="showAnnouncements" class="comms-block">
      <header class="comms-block__head">
        <h3>
          <Icon icon="mdi:bullhorn-outline" width="20" height="20" aria-hidden="true" />
          Avisos del campus
        </h3>
      </header>

      <p v-if="loading" class="comms-empty">Cargando avisos…</p>
      <p v-else-if="!announcements.length" class="comms-empty">No hay avisos por ahora.</p>

      <article
        v-for="item in announcements"
        :key="item.id"
        class="comms-item campus-glass--soft"
        :class="{ 'comms-item--pinned': item.is_pinned }"
      >
        <div class="comms-item__top">
          <strong>{{ item.title }}</strong>
          <span v-if="item.is_pinned" class="mgmt-pill mgmt-pill--accent">Destacado</span>
        </div>
        <p>{{ item.excerpt || item.body || stripPreview(item.body_html) }}</p>
        <div class="comms-item__foot">
          <small v-if="item.published_at">{{ formatDate(item.published_at) }}</small>
          <NuxtLink :to="`/campus/anuncios/${item.id}`" class="comms-text-btn">
            Ver completo
            <Icon icon="mdi:arrow-right" width="16" height="16" aria-hidden="true" />
          </NuxtLink>
        </div>
      </article>
    </section>

    <section v-if="showNotifications" id="notificaciones" class="comms-block">
      <header class="comms-block__head">
        <h3>
          <Icon icon="mdi:bell-outline" width="20" height="20" aria-hidden="true" />
          Alertas del sistema
          <span v-if="unreadCount" class="mgmt-pill">{{ unreadCount }}</span>
        </h3>
        <div class="comms-block__actions">
          <NuxtLink :to="buzonPath" class="comms-text-btn">
            Ir al buzón
            <CampusMailboxBadge placement="inline" />
          </NuxtLink>
          <button
            v-if="unreadNotifications.length && !compact"
            type="button"
            class="comms-text-btn"
            :disabled="markingAll"
            @click="onReadAll"
          >
            {{ markingAll ? 'Marcando…' : 'Marcar leídas' }}
          </button>
        </div>
      </header>

      <p v-if="actionError" class="comms-error" role="alert">{{ actionError }}</p>
      <p v-if="loading" class="comms-empty">Cargando notificaciones…</p>
      <p v-else-if="!notifications.length" class="comms-empty">No tenés notificaciones todavía.</p>

      <button
        v-for="item in notifications.slice(0, compact ? 5 : 20)"
        :key="item.id"
        type="button"
        class="comms-item comms-item--button campus-glass--soft"
        :class="{ 'comms-item--unread': !item.is_read }"
        @click="onRead(item)"
      >
        <div class="comms-item__content">
          <div class="comms-item__top">
            <strong>{{ item.title }}</strong>
            <span v-if="!item.is_read" class="comms-dot" aria-hidden="true" />
          </div>
          <small>
            {{ NOTIFICATION_TYPE_LABELS[item.notification_type] || 'Aviso' }}
            · {{ formatDate(item.created_at) }}
          </small>
          <p>{{ item.body }}</p>
        </div>
      </button>
    </section>
  </div>
</template>

<style scoped>
.comms-widget {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comms-unread {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1.1rem;
}

.comms-unread__copy {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 700;
  color: var(--campus-ink);
}

.comms-block__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.comms-block__head h3 {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--eg-font-display);
  font-size: 1.15rem;
}

.comms-block__actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
}

.comms-text-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: none;
  padding: 0;
  color: var(--eg-action);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}

.comms-text-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.comms-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 1rem 1.1rem;
  margin-bottom: 0.7rem;
  color: inherit;
}

.comms-item--button {
  font: inherit;
  cursor: pointer;
}

.comms-item--pinned {
  border-color: rgba(242, 140, 40, 0.35);
}

.comms-item--unread {
  border-color: rgba(37, 99, 235, 0.28);
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.06), rgba(255, 255, 255, 0.55));
}

.comms-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  margin-bottom: 0.35rem;
}

.comms-item__top strong {
  margin: 0;
}

.comms-item p {
  margin: 0.35rem 0 0;
  color: var(--campus-muted);
  line-height: 1.55;
  font-size: 0.92rem;
}

.comms-item small {
  color: var(--campus-ink-soft);
  font-size: 0.78rem;
}

.comms-item__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.comms-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--eg-action);
  flex-shrink: 0;
}

.comms-empty {
  color: var(--campus-muted);
  margin: 0;
}

.comms-error {
  color: var(--eg-error);
  font-size: 0.88rem;
  margin: 0 0 0.75rem;
}

.compact .comms-item {
  padding: 0.85rem 0.95rem;
}
</style>
