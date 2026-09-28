<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { MAILBOX_UPDATED_EVENT } from '~/utils/mailbox-events'

const {
  buzonPath,
  redactarPath,
  anunciosPath,
  canComposeMailbox,
  canManageAnnouncements,
} = useCampusCommsPaths()
const { fetchUnreadCount } = useCampusMailbox()
const user = useSupabaseUser()

const unreadCount = ref(0)

async function refreshUnread() {
  if (!user.value) {
    unreadCount.value = 0
    return
  }
  try {
    unreadCount.value = await fetchUnreadCount()
  } catch {
    unreadCount.value = 0
  }
}

const cards = computed(() => {
  const items = [
    {
      to: buzonPath.value,
      icon: 'mdi:email-outline',
      title: 'Mi buzón',
      description: 'Mensajes directos, alertas y respuestas entre usuarios del campus.',
      action: unreadCount.value > 0 ? `${unreadCount.value} sin leer →` : 'Abrir buzón →',
      showBadge: true,
      show: true,
      featured: unreadCount.value > 0,
    },
    {
      to: redactarPath.value,
      icon: 'mdi:pencil-outline',
      title: 'Redactar mensaje',
      description: 'Enviá mensajes o alertas a alumnos, docentes o equipo administrativo.',
      action: 'Redactar →',
      showBadge: false,
      show: canComposeMailbox.value,
      featured: false,
    },
    {
      to: anunciosPath.value,
      icon: 'mdi:bullhorn-outline',
      title: 'Editor de anuncios',
      description: 'Diseñá avisos con colores, tipografías, íconos, imágenes y videos.',
      action: 'Ir al editor →',
      showBadge: false,
      show: canManageAnnouncements.value,
      featured: false,
    },
  ]
  return items.filter((item) => item.show)
})

watch(user, () => refreshUnread())
onMounted(() => {
  refreshUnread()
  if (import.meta.client) {
    window.addEventListener('focus', refreshUnread)
    window.addEventListener(MAILBOX_UPDATED_EVENT, refreshUnread)
  }
})
useCampusAutoRefresh(refreshUnread, 45_000)
onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('focus', refreshUnread)
    window.removeEventListener(MAILBOX_UPDATED_EVENT, refreshUnread)
  }
})
</script>

<template>
  <div class="campus-mgmt-ambient">
    <CampusPageHeader
      eyebrow="CENTRO DE COMUNICACIÓN"
      title="Comunicaciones"
      description="Avisos del campus, alertas del sistema y mensajes internos en un solo lugar."
    />

    <div class="mgmt-hub-stats">
      <div class="mgmt-hub-stat campus-glass">
        <strong>{{ unreadCount }}</strong>
        <span>Mensajes sin leer</span>
      </div>
      <div class="mgmt-hub-stat campus-glass">
        <strong>{{ cards.length }}</strong>
        <span>Accesos rápidos</span>
      </div>
    </div>

    <div class="mgmt-hub-grid" style="margin-bottom: 1.5rem;">
      <NuxtLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="mgmt-hub-card campus-glass"
        :class="{ 'mgmt-hub-card--featured': card.featured }"
      >
        <span class="mgmt-hub-card__icon" aria-hidden="true">
          <Icon :icon="card.icon" width="22" height="22" />
        </span>
        <h2>{{ card.title }}</h2>
        <p>{{ card.description }}</p>
        <small>
          {{ card.action }}
          <CampusMailboxBadge v-if="card.showBadge" placement="inline" />
        </small>
      </NuxtLink>
    </div>

    <section class="comms-feed campus-glass">
      <CampusCommsWidget />
    </section>
  </div>
</template>

<style scoped>
.comms-feed {
  padding: 1.35rem 1.4rem 1.5rem;
}

:deep(.mgmt-hub-card--featured) {
  border-color: rgba(242, 140, 40, 0.4);
  background: linear-gradient(180deg, rgba(242, 140, 40, 0.1), rgba(255, 255, 255, 0.72));
}
</style>
