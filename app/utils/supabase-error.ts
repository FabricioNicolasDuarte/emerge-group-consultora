export function formatSupabaseError(error: unknown, fallback = 'Error desconocido') {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: string }).message)
    const details = 'details' in error && (error as { details?: string }).details
    const hint = 'hint' in error && (error as { hint?: string }).hint
    return [message, details, hint].filter(Boolean).join(' — ')
  }
  return fallback
}
