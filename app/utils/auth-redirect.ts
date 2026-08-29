const ALLOWED_PREFIXES = ['/campus']

export function sanitizeAuthRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  if (!ALLOWED_PREFIXES.some((prefix) => value === prefix || value.startsWith(`${prefix}/`))) {
    return null
  }
  return value
}

export function getPostLoginRedirect(fallback: string): string {
  if (!import.meta.client) return fallback
  const route = useRoute()
  const fromQuery = sanitizeAuthRedirect(route.query.redirect)
  if (fromQuery) return fromQuery
  return fallback
}
