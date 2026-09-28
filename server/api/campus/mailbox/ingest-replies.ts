import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'
import { resolveAuthUserId } from '../../../utils/campus-admin'
import { ingestMailboxEmailReplies } from '../../../utils/mailbox-imap-ingest'

function isAuthorized(event: H3Event) {
  const cronSecret = process.env.CRON_SECRET || process.env.MAILBOX_INGEST_SECRET || ''
  const header = getHeader(event, 'authorization') || ''
  const bearer = header.replace(/^Bearer\s+/i, '').trim()
  if (cronSecret && bearer && bearer === cronSecret) return true
  if (getHeader(event, 'x-vercel-cron') === '1') return true
  return false
}

async function handleIngest(event: H3Event) {
  if (!isAuthorized(event)) {
    const claims = await serverSupabaseUser(event) as Record<string, unknown> | null
    const userId = resolveAuthUserId(claims)
    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
    }
  }

  const admin = serverSupabaseServiceRole(event)
  return ingestMailboxEmailReplies(admin)
}

export default defineEventHandler(async (event) => handleIngest(event))
