<script setup lang="ts">
import type { MailboxAttachment, MailboxMessage } from '~/types/mailbox'
import { sanitizeHtml, stripHtml } from '~/utils/sanitize-html'
import { formatSupabaseError } from '~/utils/supabase-error'
import { notifyMailboxUpdated } from '~/utils/mailbox-events'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor', 'alumno'],
})

const route = useRoute()
const threadId = computed(() => route.params.threadId as string)
const { user } = useCampusAuth()
const {
  fetchThreadMessages,
  fetchThreads,
  replyToThread,
  markThreadRead,
  uploadAttachments,
  getAttachmentUrl,
  deleteMessage,
  deleteThread,
} = useCampusMailbox()

const messages = ref<MailboxMessage[]>([])
const subject = ref('')
const isOwner = ref(false)
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const replyHtml = ref('')
const replyAttachments = ref<File[]>([])
const attachmentUrls = ref<Record<string, string>>({})

useTrackFenixLoader(loading)

async function loadAttachmentUrls(items: MailboxAttachment[]) {
  const next = { ...attachmentUrls.value }
  for (const item of items) {
    if (next[item.id]) continue
    try {
      next[item.id] = await getAttachmentUrl(item.storage_path)
    } catch {
      next[item.id] = ''
    }
  }
  attachmentUrls.value = next
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [messageRows, threadRows] = await Promise.all([
      fetchThreadMessages(threadId.value),
      fetchThreads('inbox'),
    ])
    messages.value = messageRows
    const thread = threadRows.find((t) => t.thread_id === threadId.value)
      ?? (await fetchThreads('archived')).find((t) => t.thread_id === threadId.value)
      ?? (await fetchThreads('sent')).find((t) => t.thread_id === threadId.value)
    subject.value = thread?.subject ?? 'Conversación'
    isOwner.value = thread?.participant_role === 'owner' || thread?.is_outgoing === true

    const allAttachments = messageRows.flatMap((msg) => msg.attachments ?? [])
    await loadAttachmentUrls(allAttachments)
    await markThreadRead(threadId.value)
    notifyMailboxUpdated()
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo cargar la conversación')
  } finally {
    loading.value = false
  }
}

async function onReply() {
  if (!stripHtml(replyHtml.value)) {
    errorMessage.value = 'Escribí una respuesta antes de enviar.'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    const messageId = await replyToThread(threadId.value, replyHtml.value)
    if (replyAttachments.value.length) {
      await uploadAttachments(messageId, replyAttachments.value)
    }
    replyHtml.value = ''
    replyAttachments.value = []
    notifyMailboxUpdated()
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo enviar la respuesta')
  } finally {
    saving.value = false
  }
}

async function onDeleteMessage(messageId: string) {
  if (!confirm('¿Eliminar este mensaje?')) return
  errorMessage.value = ''
  try {
    await deleteMessage(messageId)
    notifyMailboxUpdated()
    await loadData()
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo eliminar el mensaje')
  }
}

async function onDeleteThread() {
  if (!confirm('¿Eliminar toda la conversación?')) return
  errorMessage.value = ''
  try {
    await deleteThread(threadId.value)
    notifyMailboxUpdated()
    await navigateTo('/campus/buzon')
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo eliminar la conversación')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="campus-mgmt-ambient mailbox-thread-page">
    <CampusPageHeader :title="subject">
      <template #actions>
        <CampusAdminCampusTableIconBtn
          icon="mdi:arrow-left"
          label="Volver al buzón"
          to="/campus/buzon"
        />
        <CampusAdminCampusTableIconBtn
          v-if="isOwner"
          icon="mdi:trash-can-outline"
          label="Eliminar conversación"
          danger
          @click="onDeleteThread"
        />
      </template>
    </CampusPageHeader>

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando conversación…</p>

    <div v-else class="mailbox-messages">
      <article
        v-for="msg in messages"
        :key="msg.id"
        class="mailbox-message campus-glass"
        :class="{ 'mailbox-message--mine': msg.sender_id === user?.id }"
      >
        <header>
          <strong>{{ msg.sender_name }}</strong>
          <span v-if="msg.source === 'email'" class="mailbox-source-tag" title="Respondido desde el correo">
            vía email
          </span>
          <time>{{ new Date(msg.created_at).toLocaleString('es-AR') }}</time>
        </header>
        <div class="mailbox-message-body" v-html="sanitizeHtml(msg.body_html)" />
        <ul v-if="msg.attachments?.length" class="mailbox-attachments">
          <li v-for="file in msg.attachments" :key="file.id">
            <a
              v-if="attachmentUrls[file.id]"
              :href="attachmentUrls[file.id]"
              target="_blank"
              rel="noopener"
            >
              {{ file.file_name }}
            </a>
            <span v-else>{{ file.file_name }}</span>
          </li>
        </ul>
        <div v-if="msg.sender_id === user?.id" class="mgmt-mailbox-card__actions" style="margin-top: 0.65rem;">
          <CampusAdminCampusTableIconBtn
            icon="mdi:trash-can-outline"
            label="Eliminar mensaje"
            danger
            @click="onDeleteMessage(msg.id)"
          />
        </div>
      </article>
    </div>

    <section class="mailbox-reply-box campus-glass">
      <h2>Responder</h2>
      <ClientOnly>
        <CampusRichTextEditor
          v-model="replyHtml"
          placeholder="Escribí tu respuesta…"
          min-height="180px"
        />
      </ClientOnly>
      <CampusMailboxAttachmentField
        v-model="replyAttachments"
        :disabled="saving"
        label="Adjuntos de la respuesta"
      />
      <button type="button" class="campus-btn campus-btn--primary" :disabled="saving" @click="onReply">
        {{ saving ? 'Enviando…' : 'Enviar respuesta' }}
      </button>
    </section>
  </div>
</template>
