<script setup lang="ts">
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
const { redactarPath } = useCampusCommsPaths()

const threads = ref<MailboxThread[]>([])
const unreadCount = ref(0)
const loading = ref(true)
const errorMessage = ref('')
const actionMessage = ref('')
const filter = ref<MailboxThreadFilter>('inbox')
const search = ref('')

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
  await loadData()
})
</script>

<template>
  <div class="campus-page mailbox-page">
    <CampusPageHeader
      eyebrow="COMUNICACIÓN INTERNA"
      title="Mi buzón"
      description="Mensajes, alertas y respuestas del equipo de Campus Emerge."
    >
      <template #actions>
        <span v-if="unreadCount" class="mailbox-unread-pill">{{ unreadCount }} sin leer</span>
        <NuxtLink v-if="canCompose" :to="redactarPath" class="campus-btn campus-btn--primary">
          Redactar
        </NuxtLink>
      </template>
    </CampusPageHeader>

    <div class="mailbox-toolbar">
      <CampusSegmented
        v-model="filter"
        :options="filterOptions"
        aria-label="Filtrar conversaciones"
      />
      <input
        v-model="search"
        type="search"
        placeholder="Buscar conversación…"
        class="mailbox-search"
        aria-label="Buscar conversación"
      >
    </div>

    <p v-if="actionMessage" class="campus-banner campus-banner--success">{{ actionMessage }}</p>
    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="campus-banner">Cargando buzón…</p>

    <div v-else-if="!filteredThreads.length" class="mailbox-empty">
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

    <div v-else class="mailbox-thread-list">
      <article
        v-for="thread in filteredThreads"
        :key="thread.thread_id"
        class="mailbox-thread-card"
        :class="{ 'mailbox-thread-card--unread': thread.unread_count > 0 }"
      >
        <NuxtLink :to="`/campus/buzon/${thread.thread_id}`" class="mailbox-thread-link">
          <div>
            <div class="mailbox-thread-top">
              <strong>{{ thread.subject }}</strong>
              <span v-if="thread.is_outgoing" class="mailbox-tag mailbox-tag--sent">Enviado</span>
              <span v-if="thread.unread_count" class="mailbox-unread-dot">{{ thread.unread_count }}</span>
            </div>
            <p>{{ thread.other_participant_name || 'Campus Emerge' }}</p>
            <small>{{ thread.last_message_preview }}</small>
          </div>
          <time>{{ new Date(thread.last_message_at).toLocaleString('es-AR') }}</time>
        </NuxtLink>
        <div class="mailbox-thread-actions">
          <button
            type="button"
            class="mailbox-archive-btn"
            @click="onArchive(thread.thread_id, filter !== 'archived')"
          >
            {{ filter === 'archived' ? 'Restaurar' : 'Archivar' }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
