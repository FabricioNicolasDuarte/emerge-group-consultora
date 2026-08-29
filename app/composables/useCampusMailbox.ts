import type {

  MailboxContact,

  MailboxMessage,

  MailboxThread,

  SendMailboxInput,

} from '~/types/mailbox'

import { stripHtml } from '~/utils/sanitize-html'



export type MailboxThreadFilter = 'inbox' | 'archived' | 'sent'



export function useCampusMailbox() {

  const supabase = useSupabaseClient()

  const user = useSupabaseUser()



  async function fetchThreads(filter: MailboxThreadFilter = 'inbox') {

    let query = supabase.from('my_mailbox_threads').select('*')



    if (filter === 'archived') {

      query = query.eq('is_archived', true)

    } else {

      query = query.eq('is_archived', false)

      if (filter === 'sent') {

        query = query.eq('is_outgoing', true)

      }

    }



    const { data, error } = await query

    if (error) throw error

    return (data ?? []) as MailboxThread[]

  }



  async function fetchUnreadCount() {

    const { data, error } = await supabase

      .from('my_mailbox_unread')

      .select('unread_count')

      .maybeSingle()

    if (error) throw error

    return data?.unread_count ?? 0

  }



  async function fetchThreadMessages(threadId: string) {

    const { data, error } = await supabase

      .from('mailbox_thread_messages')

      .select('*')

      .eq('thread_id', threadId)

    if (error) throw error

    return (data ?? []) as MailboxMessage[]

  }



  async function fetchContacts() {

    const { data, error } = await supabase.from('mailbox_contacts').select('*')

    if (error) throw error

    return (data ?? []) as MailboxContact[]

  }



  async function sendMessage(input: SendMailboxInput) {

    const bodyText = input.body_text ?? stripHtml(input.body_html)

    const { data, error } = await supabase.rpc('mailbox_send_message', {

      p_recipient_id: input.recipient_id,

      p_subject: input.subject.trim(),

      p_body_html: input.body_html,

      p_body_text: bodyText,

      p_message_type: input.message_type ?? 'message',

      p_course_id: input.course_id ?? null,

    })

    if (error) throw error

    return data as string

  }



  async function replyToThread(threadId: string, bodyHtml: string) {

    const bodyText = stripHtml(bodyHtml)

    const { data, error } = await supabase.rpc('mailbox_reply', {

      p_thread_id: threadId,

      p_body_html: bodyHtml,

      p_body_text: bodyText,

    })

    if (error) throw error

    return data as string

  }



  async function markThreadRead(threadId: string) {

    const { error } = await supabase.rpc('mailbox_mark_thread_read', {

      p_thread_id: threadId,

    })

    if (error) throw error

  }



  async function archiveThread(threadId: string, archived = true) {

    const { error } = await supabase.rpc('mailbox_archive_thread', {

      p_thread_id: threadId,

      p_archived: archived,

    })

    if (error) throw error

  }



  async function deleteMessage(messageId: string) {

    const { error } = await supabase.rpc('mailbox_delete_message', {

      p_message_id: messageId,

    })

    if (error) throw error

  }



  async function deleteThread(threadId: string) {

    const { error } = await supabase.rpc('mailbox_delete_thread', {

      p_thread_id: threadId,

    })

    if (error) throw error

  }



  async function uploadAttachment(messageId: string, file: File) {

    if (!user.value) throw new Error('No autenticado')

    const ext = file.name.split('.').pop() ?? 'bin'

    const path = `${user.value.id}/${messageId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage

      .from('mailbox-attachments')

      .upload(path, file, { upsert: false, contentType: file.type })

    if (uploadError) throw uploadError



    const { data, error } = await supabase

      .from('mailbox_attachments')

      .insert({

        message_id: messageId,

        storage_path: path,

        file_name: file.name,

        mime_type: file.type,

        file_size: file.size,

      })

      .select()

      .single()

    if (error) throw error

    return data

  }



  async function getAttachmentUrl(storagePath: string) {

    const { data, error } = await supabase.storage

      .from('mailbox-attachments')

      .createSignedUrl(storagePath, 3600)

    if (error) throw error

    return data.signedUrl

  }



  async function uploadAttachments(messageId: string, files: File[]) {

    for (const file of files) {

      await uploadAttachment(messageId, file)

    }

  }



  async function getThreadInitialMessageId(threadId: string) {

    const messages = await fetchThreadMessages(threadId)

    if (!messages.length) return null

    return [...messages].sort(

      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),

    )[0]?.id ?? null

  }



  return {

    fetchThreads,

    fetchUnreadCount,

    fetchThreadMessages,

    fetchContacts,

    sendMessage,

    replyToThread,

    markThreadRead,

    archiveThread,

    deleteMessage,

    deleteThread,

    uploadAttachment,

    uploadAttachments,

    getThreadInitialMessageId,

    getAttachmentUrl,

  }

}


