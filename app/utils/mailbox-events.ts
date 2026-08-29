export const MAILBOX_UPDATED_EVENT = 'campus-mailbox-updated'

export function notifyMailboxUpdated() {
  if (import.meta.client) {
    window.dispatchEvent(new CustomEvent(MAILBOX_UPDATED_EVENT))
  }
}
