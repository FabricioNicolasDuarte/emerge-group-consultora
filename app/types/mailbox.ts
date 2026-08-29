export type MailboxThreadKind = 'direct' | 'alert'
export type MailboxMessageType = 'message' | 'alert' | 'reply'

export interface MailboxThread {
  thread_id: string
  subject: string
  thread_kind: MailboxThreadKind
  course_id: string | null
  last_message_at: string
  created_at: string
  is_archived: boolean
  last_read_at: string | null
  unread_count: number
  last_message_preview: string | null
  other_participant_name: string | null
  created_by?: string
  participant_role?: 'owner' | 'member'
  is_outgoing?: boolean
}

export interface MailboxAttachment {
  id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
}

export interface MailboxMessage {
  id: string
  thread_id: string
  sender_id: string
  sender_name: string
  sender_email: string | null
  body_html: string
  body_text: string
  message_type: MailboxMessageType
  created_at: string
  attachments: MailboxAttachment[]
}

export interface MailboxContact {
  id: string
  full_name: string
  email: string | null
  role_slugs: string[]
}

export interface SendMailboxInput {
  recipient_id: string
  subject: string
  body_html: string
  body_text?: string
  message_type?: MailboxMessageType
  course_id?: string | null
}

export const MAILBOX_TYPE_LABELS: Record<MailboxMessageType, string> = {
  message: 'Mensaje',
  alert: 'Alerta',
  reply: 'Respuesta',
}
