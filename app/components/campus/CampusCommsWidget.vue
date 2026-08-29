<script setup lang="ts">
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

    <div v-if="showNotifications && unreadCount > 0 && !compact" class="unread-banner">
      <span>{{ unreadCount }} notificación{{ unreadCount === 1 ? '' : 'es' }} sin leer</span>
      <button type="button" :disabled="markingAll" @click="onReadAll">
        {{ markingAll ? 'Marcando…' : 'Marcar todas leídas' }}
      </button>
    </div>

    <div v-if="showAnnouncements" class="block">
      <h3 v-if="!compact">Avisos del campus</h3>
      <p v-if="loading" class="empty">Cargando avisos…</p>
      <p v-else-if="!announcements.length" class="empty">No hay avisos por ahora.</p>
      <article
        v-for="item in announcements"
        :key="item.id"
        class="announcement-item"
        :class="{ pinned: item.is_pinned }"
      >
        <div class="item-top">
          <strong>{{ item.title }}</strong>
          <span v-if="item.is_pinned" class="tag">Destacado</span>
        </div>
        <p>{{ item.excerpt || item.body || stripPreview(item.body_html) }}</p>
        <small v-if="item.published_at">{{ formatDate(item.published_at) }}</small>
        <NuxtLink :to="`/campus/anuncios/${item.id}`" class="read-more">Ver completo →</NuxtLink>
      </article>
    </div>

    <div v-if="showNotifications" id="notificaciones" class="block">
      <div class="block-head">
        <h3 v-if="!compact">
          Alertas del sistema
          <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
        </h3>
        <NuxtLink to="/campus/buzon" class="mailbox-link">
          Ir al buzón
          <CampusMailboxBadge placement="inline" />
          →
        </NuxtLink>
        <button
          v-if="unreadNotifications.length && !compact"
          type="button"
          class="link-btn"
          :disabled="markingAll"
          @click="onReadAll"
        >
          {{ markingAll ? 'Marcando…' : 'Marcar todas leídas' }}
        </button>
      </div>

      <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>

      <p v-if="loading" class="empty">Cargando notificaciones…</p>
      <p v-else-if="!notifications.length" class="empty">No tenés notificaciones todavía.</p>

      <button
        v-for="item in notifications.slice(0, compact ? 5 : 20)"
        :key="item.id"
        type="button"
        class="notification-item"
        :class="{ unread: !item.is_read }"
        @click="onRead(item)"
      >
        <div>
          <strong>{{ item.title }}</strong>
          <small>{{ NOTIFICATION_TYPE_LABELS[item.notification_type] || 'Aviso' }} · {{ formatDate(item.created_at) }}</small>
          <p>{{ item.body }}</p>
        </div>
        <span v-if="!item.is_read" class="dot" aria-hidden="true" />
      </button>
    </div>

  </div>
</template>

<style scoped>
.comms-widget {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.unread-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--eg-ink), var(--eg-action));
  color: var(--eg-surface);
}

.unread-banner button {
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: var(--eg-surface);
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.block h3 {
  font-family: var(--eg-font-display);
  font-size: 28px;
  margin: 0 0 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.block-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.block-head h3 { margin: 0; }

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--eg-accent);
  color: var(--eg-surface);
  font-size: 12px;
  font-family: var(--eg-font-body);
}

.link-btn,
.mailbox-link {
  border: none;
  background: none;
  color: var(--eg-action);
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.read-more {
  display: inline-block;
  margin-top: 10px;
  color: var(--eg-action);
  font-weight: 700;
  text-decoration: none;
  font-size: 14px;
}

.announcement-item,
.notification-item {
  width: 100%;
  text-align: left;
  background: var(--eg-surface);
  border: 1px solid var(--eg-border);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 12px;
  box-shadow: var(--eg-shadow-sm);
}

.announcement-item.pinned {
  border-color: rgba(242, 140, 40, 0.35);
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  font-family: inherit;
}

.notification-item.unread {
  border-color: rgba(37, 99, 235, 0.25);
  background: var(--eg-highlight-bg);
}

.item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.announcement-item strong,
.notification-item strong {
  display: block;
  margin-bottom: 6px;
}

.announcement-item p,
.notification-item p {
  margin: 8px 0 0;
  color: var(--eg-muted);
  line-height: 1.6;
}

.announcement-item small,
.notification-item small {
  color: var(--eg-subtle);
}

.tag {
  font-size: 11px;
  font-weight: 800;
  color: var(--eg-accent);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--eg-action);
  flex-shrink: 0;
  margin-top: 6px;
}

.empty {
  color: var(--eg-subtle);
}

.action-error {
  color: var(--eg-error);
  font-size: 14px;
  margin: 0 0 12px;
}

.link-btn:disabled,
.unread-banner button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.compact .announcement-item,
.compact .notification-item {
  padding: 14px 16px;
}
</style>
