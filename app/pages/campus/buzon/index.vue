<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { MailboxThread } from '~/types/mailbox'
import type { MailboxThreadFilter } from '~/composables/useCampusMailbox'
import { formatSupabaseError } from '~/utils/supabase-error'
import { notifyMailboxUpdated } from '~/utils/mailbox-events'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor', 'alumno'],
  campusNav: [
    {
      panel: 'student',
      group: 'Comunicación',
      label: 'Mi buzón',
      icon: 'miBuzon',
      order: 2,
      badge: true,
    },
    {
      panel: 'teacher',
      group: 'Comunicación',
      label: 'Mi buzón',
      icon: 'miBuzon',
      order: 3,
      badge: true,
    },
    {
      panel: 'admin',
      group: 'Sistema',
      label: 'Mi buzón',
      icon: 'miBuzon',
      order: 3,
      badge: true,
    },
  ],
})

const { user, hasRole, hasAnyStaffRole, fetchProfile } = useCampusAuth()
const { fetchThreads, fetchUnreadCount, archiveThread } = useCampusMailbox()
const { redactarPath, hubPath } = useCampusCommsPaths()

const threads = ref<MailboxThread[]>([])
const unreadCount = ref(0)
const loading = ref(true)
const errorMessage = ref('')
const actionMessage = ref('')
const filter = ref<MailboxThreadFilter>('inbox')
const search = ref('')

useTrackFenixLoader(loading)

const filterOptions = [
  { value: 'inbox', label: 'Bandeja' },
  { value: 'sent', label: 'Enviados' },
  { value: 'archived', label: 'Archivados' },
]

const canCompose = computed(() => hasAnyStaffRole() || hasRole('docente', 'tutor'))

const filteredThreads = computed(() => {
  const q = search.value.trim().toLowerCase()
  return threads.value.filter((t) => {
    if (!q) return true
    return t.subject.toLowerCase().includes(q)
      || (t.other_participant_name ?? '').toLowerCase().includes(q)
      || (t.last_message_preview ?? '').toLowerCase().includes(q)
  })
})

function formatThreadTime(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [rows, unread] = await Promise.all([
      fetchThreads(filter.value),
      fetchUnreadCount(),
    ])
    threads.value = rows
    unreadCount.value = unread
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo cargar el buzón')
  } finally {
    loading.value = false
  }
}

async function onArchive(threadId: string, archived: boolean) {
  actionMessage.value = ''
  errorMessage.value = ''
  try {
    await archiveThread(threadId, archived)
    actionMessage.value = archived ? 'Conversación archivada.' : 'Conversación restaurada.'
    notifyMailboxUpdated()
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo actualizar la conversación')
  }
}

watch(filter, () => loadData())
useCampusAutoRefresh(loadData, 60_000)

onMounted(async () => {
  if (!user.value) {
    await navigateTo('/campus/login?redirect=/campus/buzon')
    return
  }
  await fetchProfile()
  // Trae respuestas hechas desde Gmail (IMAP) sin esperar al cron.
  void $fetch('/api/campus/mailbox/ingest-replies').catch(() => {})
  await loadData()
})
</script>

<template>
  <div class="campus-mgmt-ambient">
    <CampusPageHeader
      eyebrow="COMUNICACIÓN INTERNA"
      title="Mi buzón"
      description="Mensajes, alertas y respuestas del equipo de Campus Emerge."
    >
      <template #actions>
        <span v-if="unreadCount" class="mgmt-pill">{{ unreadCount }} sin leer</span>
        <CampusAdminCampusTableIconBtn
          icon="mdi:view-dashboard-outline"
          label="Centro de comunicación"
          :to="hubPath"
        />
        <CampusAdminCampusTableIconBtn
          v-if="canCompose"
          icon="mdi:pencil-plus-outline"
          label="Redactar"
          :to="redactarPath"
        />
      </template>
    </CampusPageHeader>

    <div class="mgmt-toolbar campus-glass--soft">
      <CampusSegmented
        v-model="filter"
        :options="filterOptions"
        aria-label="Filtrar conversaciones"
      />
      <input
        v-model="search"
        type="search"
        placeholder="Buscar conversación…"
        aria-label="Buscar conversación"
      >
    </div>

    <p v-if="actionMessage" class="campus-banner campus-banner--success">{{ actionMessage }}</p>
    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando buzón…</p>

    <div v-else-if="!filteredThreads.length" class="mgmt-empty campus-glass">
      <p>
        {{
          filter === 'archived'
            ? 'No tenés conversaciones archivadas.'
            : filter === 'sent'
              ? 'Todavía no enviaste mensajes.'
              : 'Tu buzón está vacío.'
        }}
      </p>
      <NuxtLink v-if="canCompose && filter !== 'archived'" :to="redactarPath" class="empty-cta">
        Enviar el primer mensaje →
      </NuxtLink>
    </div>

    <div v-else class="mgmt-mailbox-list">
      <article
        v-for="thread in filteredThreads"
        :key="thread.thread_id"
        class="mgmt-mailbox-card campus-glass"
        :class="{ 'mgmt-mailbox-card--unread': thread.unread_count > 0 }"
      >
        <NuxtLink :to="`/campus/buzon/${thread.thread_id}`" class="mgmt-mailbox-card__link">
          <CampusAvatar
            :name="thread.other_participant_name || 'Campus Emerge'"
            size="md"
          />
          <div class="mgmt-mailbox-card__body">
            <div class="mgmt-mailbox-card__top">
              <strong>{{ thread.subject }}</strong>
              <span v-if="thread.is_outgoing" class="mgmt-pill mgmt-pill--soft">Enviado</span>
              <span v-if="thread.unread_count" class="mgmt-pill">{{ thread.unread_count }}</span>
            </div>
            <p class="mgmt-mailbox-card__from">
              {{ thread.other_participant_name || 'Campus Emerge' }}
            </p>
            <p class="mgmt-mailbox-card__preview">
              {{ thread.last_message_preview || 'Sin vista previa' }}
            </p>
          </div>
          <time class="mgmt-mailbox-card__time">{{ formatThreadTime(thread.last_message_at) }}</time>
        </NuxtLink>
        <div class="mgmt-mailbox-card__actions">
          <CampusAdminCampusTableIconBtn
            :icon="filter === 'archived' ? 'mdi:inbox-arrow-up-outline' : 'mdi:archive-outline'"
            :label="filter === 'archived' ? 'Restaurar' : 'Archivar'"
            @click="onArchive(thread.thread_id, filter !== 'archived')"
          />
          <NuxtLink
            :to="`/campus/buzon/${thread.thread_id}`"
            class="campus-icon-btn"
            title="Abrir"
            aria-label="Abrir conversación"
          >
            <Icon icon="mdi:chevron-right" width="18" height="18" aria-hidden="true" />
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>
