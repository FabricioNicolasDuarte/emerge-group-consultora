<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { MAILBOX_UPDATED_EVENT } from '~/utils/mailbox-events'

const { fetchUnreadCount } = useCampusMailbox()
const user = useSupabaseUser()
const route = useRoute()

const count = ref(0)
const dismissed = ref(false)

const STORAGE_KEY = 'campus-unread-alert-dismissed'

const visible = computed(() =>
  Boolean(user.value) && count.value > 0 && !dismissed.value,
)

const label = computed(() => {
  if (count.value === 1) return 'Tenés 1 mensaje sin leer en el buzón'
  return `Tenés ${count.value} mensajes sin leer en el buzón`
})

async function refresh() {
  if (!user.value) {
    count.value = 0
    return
  }
  try {
    const next = await fetchUnreadCount()
    if (next > count.value) {
      dismissed.value = false
      if (import.meta.client) sessionStorage.removeItem(STORAGE_KEY)
    }
    count.value = next
    if (count.value === 0) {
      dismissed.value = false
      if (import.meta.client) sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    count.value = 0
  }
}

function dismiss() {
  dismissed.value = true
  if (import.meta.client) {
    sessionStorage.setItem(STORAGE_KEY, '1')
  }
}

watch(user, () => refresh())
watch(() => route.fullPath, () => {
  // Re-show when landing on home panels if there are unread messages.
  if (import.meta.client && sessionStorage.getItem(STORAGE_KEY) === '1') {
    dismissed.value = true
  }
  refresh()
})

onMounted(() => {
  if (import.meta.client && sessionStorage.getItem(STORAGE_KEY) === '1') {
    dismissed.value = true
  }
  refresh()
  if (import.meta.client) {
    window.addEventListener('focus', refresh)
    window.addEventListener(MAILBOX_UPDATED_EVENT, refresh)
  }
})

useCampusAutoRefresh(refresh, 45_000)

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('focus', refresh)
    window.removeEventListener(MAILBOX_UPDATED_EVENT, refresh)
  }
})
</script>

<template>
  <div
    v-if="visible"
    class="campus-unread-alert"
    role="status"
    aria-live="polite"
  >
    <div class="campus-unread-alert__copy">
      <span class="campus-unread-alert__icon" aria-hidden="true">
        <Icon icon="mdi:email-alert-outline" width="22" height="22" />
      </span>
      <div>
        <strong>{{ label }}</strong>
        <p>Abrí el buzón para leer recordatorios, tareas o avisos del equipo.</p>
      </div>
    </div>
    <div class="campus-unread-alert__actions">
      <NuxtLink to="/campus/buzon" class="campus-unread-alert__cta">
        Ver mensajes
      </NuxtLink>
      <button type="button" class="campus-unread-alert__dismiss" @click="dismiss">
        Ahora no
      </button>
    </div>
  </div>
</template>

<style scoped>
.campus-unread-alert {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem 1rem;
  margin-bottom: 1.15rem;
  padding: 0.95rem 1.1rem;
  border-radius: 18px;
  border: 1px solid rgba(242, 140, 40, 0.35);
  background:
    linear-gradient(135deg, rgba(242, 140, 40, 0.16), rgba(37, 99, 235, 0.08)),
    rgba(255, 255, 255, 0.84);
  box-shadow: 0 10px 28px rgba(13, 44, 84, 0.08);
  backdrop-filter: blur(10px);
}

.campus-unread-alert__copy {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
}

.campus-unread-alert__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: rgba(242, 140, 40, 0.18);
  color: #c45f00;
}

.campus-unread-alert__copy strong {
  display: block;
  font-size: 0.98rem;
  color: var(--campus-ink);
}

.campus-unread-alert__copy p {
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  color: var(--campus-muted);
}

.campus-unread-alert__actions {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.campus-unread-alert__cta {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  background: var(--eg-action);
  color: #fff;
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
}

.campus-unread-alert__dismiss {
  border: none;
  background: transparent;
  color: var(--campus-muted);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.45rem 0.65rem;
}

.campus-unread-alert__dismiss:hover {
  color: var(--campus-ink);
}
</style>
