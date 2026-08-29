<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { MAILBOX_UPDATED_EVENT } from '~/utils/mailbox-events'

withDefaults(defineProps<{
  placement?: 'sidebar' | 'inline'
}>(), {
  placement: 'sidebar',
})

const { fetchUnreadCount } = useCampusMailbox()
const user = useSupabaseUser()
const count = ref(0)

async function refresh() {
  if (!user.value) {
    count.value = 0
    return
  }
  try {
    count.value = await fetchUnreadCount()
  } catch {
    count.value = 0
  }
}

const label = computed(() => (count.value > 99 ? '99+' : String(count.value)))

watch(user, () => refresh())

onMounted(() => {
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
  <span
    v-if="count > 0"
    class="mailbox-badge"
    :class="placement"
    :title="`${count} mensaje(s) sin leer`"
  >{{ label }}</span>
</template>

<style scoped>
.mailbox-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #F28C28;
  color: white;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  flex-shrink: 0;
  border: 2px solid #fff;
}

.mailbox-badge.sidebar {
  margin-left: auto;
}

.mailbox-badge.inline {
  position: absolute;
  top: -4px;
  right: -4px;
  margin-left: 0;
}
</style>
