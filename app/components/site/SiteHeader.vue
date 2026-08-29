<script setup lang="ts">
import { SITE_NAV } from '~/data/site-content'
</script>

<template>
  <PublicHeader
    home-to="/"
    :nav="SITE_NAV"
    cta-to="/campus"
    cta-label="Campus"
    cta-variant="dark"
  />
</template>
