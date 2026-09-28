import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  extractEmailAddress,
  extractThreadIdFromAddress,
  extractThreadIdFromSubject,
  getMailConfig,
  stripQuotedEmailReply,
} from './mail'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function textToHtml(text: string) {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

export async function ingestMailboxEmailReplies(admin: SupabaseClient) {
  const config = getMailConfig()
  if (!config.imap.user || !config.imap.pass) {
    return { processed: 0, imported: 0, skipped: 0, reason: 'imap_not_configured' as const }
  }

  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: true,
    auth: {
      user: config.imap.user,
      pass: config.imap.pass,
    },
    logger: false,
  })

  let processed = 0
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  await client.connect()
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      // Últimos 40 no leídos (o recientes) para no barrer toda la bandeja.
      const uids = await client.search({ seen: false }, { uid: true })
      const recent = Array.isArray(uids) ? uids.slice(-40) : []

      for (const uid of recent) {
        processed += 1
        try {
          const downloaded = await client.download(uid, undefined, { uid: true })
          if (!downloaded?.content) {
            skipped += 1
            continue
          }

          const parsed = await simpleParser(downloaded.content)
          const internetId = String(parsed.messageId || '').trim()
          if (internetId) {
            const { data: already } = await admin
              .from('mailbox_email_ingest')
              .select('id')
              .eq('internet_message_id', internetId)
              .maybeSingle()
            if (already) {
              await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
              skipped += 1
              continue
            }
          }

          const toList = [
            ...(Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : []),
            ...(Array.isArray(parsed.cc) ? parsed.cc : parsed.cc ? [parsed.cc] : []),
          ]
            .flatMap((item) => ('value' in item ? item.value : []))
            .map((v) => v.address || '')
            .filter(Boolean)

          const delivered = String(
            parsed.headers?.get('delivered-to')
            || parsed.headers?.get('x-original-to')
            || '',
          )

          let threadId: string | null = null
          for (const addr of [...toList, delivered]) {
            threadId = extractThreadIdFromAddress(addr)
            if (threadId) break
          }
          if (!threadId) {
            threadId = extractThreadIdFromSubject(String(parsed.subject || ''))
          }

          if (!threadId) {
            skipped += 1
            continue
          }

          const fromEmail = extractEmailAddress(
            parsed.from?.value?.[0]?.address
            || parsed.from?.text
            || '',
          )
          if (!fromEmail) {
            skipped += 1
            continue
          }

          const rawText = String(parsed.text || '').trim()
            || String(parsed.html || '').replace(/<[^>]+>/g, ' ').trim()
          const cleanText = stripQuotedEmailReply(rawText)
          if (!cleanText) {
            skipped += 1
            continue
          }

          const bodyHtml = `<p>${textToHtml(cleanText)}</p>`

          const { data: messageId, error } = await admin.rpc('mailbox_ingest_email_reply', {
            p_thread_id: threadId,
            p_sender_email: fromEmail,
            p_body_html: bodyHtml,
            p_body_text: cleanText,
            p_internet_message_id: internetId || `uid-${uid}-${Date.now()}`,
          })

          if (error) {
            errors.push(error.message)
            skipped += 1
            continue
          }

          if (messageId) imported += 1
          await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
        } catch (error: unknown) {
          errors.push(error instanceof Error ? error.message : 'ingest_item_failed')
          skipped += 1
        }
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout().catch(() => {})
  }

  return { processed, imported, skipped, errors: errors.slice(0, 5) }
}
