<script setup lang="ts">
import type { MailboxContact } from '~/types/mailbox'
import { formatSupabaseError } from '~/utils/supabase-error'
import { buildMailboxHtml, stripHtml } from '~/utils/sanitize-html'
import { notifyMailboxUpdated } from '~/utils/mailbox-events'

definePageMeta({
  layout: 'campus-panel',
  middleware: ['campus-role'],
  campusRoles: ['superadmin', 'admin', 'coordinador', 'docente', 'tutor', 'alumno'],
})

const route = useRoute()
const { hasAnyStaffRole, hasRole, fetchProfile } = useCampusAuth()
const { fetchContacts, sendMessage, uploadAttachments, getThreadInitialMessageId } = useCampusMailbox()

const contacts = ref<MailboxContact[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const attachments = ref<File[]>([])

const form = reactive({
  recipient_id: String(route.query.to || ''),
  subject: '',
  body_html: '',
  header_html: '',
  footer_html: '',
  message_type: 'message' as 'message' | 'alert',
  notify_email: true,
})

const canCompose = computed(() => hasAnyStaffRole() || hasRole('docente', 'tutor'))

async function notifyRecipientEmail(input: {
  recipient_id: string
  subject: string
  preview: string
  thread_id: string
}) {
  try {
    await $fetch('/api/campus/mailbox/notify-email', {
      method: 'POST',
      body: input,
    })
  } catch {
    // Best-effort: el mensaje interno ya se guardó.
  }
}

onMounted(async () => {
  await fetchProfile()
  if (!canCompose.value) {
    await navigateTo('/campus/buzon')
    return
  }
  try {
    contacts.value = await fetchContacts()
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudieron cargar los contactos')
  } finally {
    loading.value = false
  }
})

async function onSubmit() {
  errorMessage.value = ''

  if (!form.recipient_id) {
    errorMessage.value = 'Seleccioná un destinatario.'
    return
  }
  if (!form.subject.trim()) {
    errorMessage.value = 'El asunto es obligatorio.'
    return
  }
  if (!stripHtml(form.body_html)) {
    errorMessage.value = 'Escribí el mensaje antes de enviar.'
    return
  }

  const fullHtml = buildMailboxHtml({
    headerHtml: form.header_html,
    bodyHtml: form.body_html,
    footerHtml: form.footer_html,
  })

  saving.value = true
  try {
    const threadId = await sendMessage({
      recipient_id: form.recipient_id,
      subject: form.subject,
      body_html: fullHtml,
      message_type: form.message_type,
    })
    if (attachments.value.length) {
      const messageId = await getThreadInitialMessageId(threadId)
      if (messageId) {
        await uploadAttachments(messageId, attachments.value)
      }
    }
    if (form.notify_email) {
      await notifyRecipientEmail({
        recipient_id: form.recipient_id,
        subject: form.subject.trim(),
        preview: stripHtml(form.body_html).slice(0, 240),
        thread_id: threadId,
      })
    }
    notifyMailboxUpdated()
    await navigateTo(`/campus/buzon/${threadId}`)
  } catch (error: unknown) {
    errorMessage.value = formatSupabaseError(error, 'No se pudo enviar el mensaje')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="campus-mgmt-ambient mailbox-compose-page">
    <CampusPageHeader
      eyebrow="REDACTAR"
      title="Nuevo mensaje"
      description="Escribí a un usuario del campus. Podés adjuntar archivos y usar encabezado o pie."
    >
      <template #actions>
        <CampusAdminCampusTableIconBtn
          icon="mdi:arrow-left"
          label="Volver al buzón"
          to="/campus/buzon"
        />
      </template>
    </CampusPageHeader>

    <p v-if="errorMessage" class="campus-banner campus-banner--error">{{ errorMessage }}</p>
    <p v-if="loading" class="mgmt-empty campus-glass">Cargando contactos…</p>

    <form v-else class="mailbox-compose-form campus-glass" @submit.prevent="onSubmit">
      <label>
        Destinatario
        <select v-model="form.recipient_id" required>
          <option value="">Seleccionar usuario</option>
          <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
            {{ contact.full_name }} — {{ contact.role_slugs.join(', ') }}
          </option>
        </select>
      </label>

      <label>
        Tipo
        <select v-model="form.message_type">
          <option value="message">Mensaje</option>
          <option value="alert">Alerta importante</option>
        </select>
      </label>

      <label>
        Asunto
        <input v-model="form.subject" type="text" required placeholder="Asunto del mensaje">
      </label>

      <CampusMailboxRichComposer
        v-model="form.body_html"
        v-model:header-html="form.header_html"
        v-model:footer-html="form.footer_html"
        :disabled="saving"
      />

      <CampusMailboxAttachmentField v-model="attachments" :disabled="saving" />

      <label class="mailbox-compose-check">
        <input v-model="form.notify_email" type="checkbox">
        También avisar por correo electrónico al destinatario
      </label>

      <div class="mailbox-compose-actions">
        <NuxtLink to="/campus/buzon" class="mailbox-compose-cancel">Cancelar</NuxtLink>
        <button type="submit" class="campus-btn campus-btn--primary" :disabled="saving">
          {{ saving ? 'Enviando…' : 'Enviar mensaje' }}
        </button>
      </div>
    </form>
  </div>
</template>
