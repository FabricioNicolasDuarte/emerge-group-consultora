<script setup lang="ts">
import { CAMPUS_PUBLIC_NAV } from '~/data/campus-public-content'

const props = defineProps<{
  user: { id: string } | null
  dashboardPath: string
  showAnnouncements?: boolean
}>()
</script>

<template>
  <PublicHeader
    home-to="/campus"
    :nav="CAMPUS_PUBLIC_NAV"
    :extra-nav="props.showAnnouncements ? [{ id: 'avisos', label: 'Avisos' }] : undefined"
    secondary-to="/"
    secondary-label="Sitio"
    :cta-to="props.user ? props.dashboardPath : '/campus/login'"
    :cta-label="props.user ? 'Mi campus' : 'Ingresar'"
    cta-variant="action"
  />
</template>
