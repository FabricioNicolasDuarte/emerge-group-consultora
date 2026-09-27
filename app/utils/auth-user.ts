const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * @nuxtjs/supabase v2 may expose JWT claims (`sub`) instead of `{ id }`.
 * Use this whenever filtering/inserting by the authenticated user id on the client.
 */
export function resolveAuthUserId(
  user: { id?: unknown, sub?: unknown } | Record<string, unknown> | null | undefined,
): string | null {
  if (!user || typeof user !== 'object') return null
  const raw = (user as { id?: unknown, sub?: unknown }).id
    ?? (user as { id?: unknown, sub?: unknown }).sub
  if (typeof raw !== 'string') return null
  const id = raw.trim()
  return UUID_RE.test(id) ? id : null
}
