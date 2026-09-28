<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { videoThumbnailUrl } from '~/utils/video'

const props = withDefaults(defineProps<{
  url?: string | null
  title?: string
  to?: string
  href?: string
}>(), {
  url: null,
  title: 'Video',
  to: undefined,
  href: undefined,
})

const thumb = computed(() => videoThumbnailUrl(props.url))
const broken = ref(false)

watch(() => props.url, () => {
  broken.value = false
})
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="campus-video-thumb"
    :aria-label="title"
  >
    <img
      v-if="thumb && !broken"
      :src="thumb"
      :alt="title"
      class="campus-video-thumb__img"
      loading="lazy"
      @error="broken = true"
    >
    <div v-else class="campus-video-thumb__fallback" aria-hidden="true">
      <Icon icon="mdi:play-circle-outline" width="42" height="42" />
    </div>
    <span class="campus-video-thumb__play" aria-hidden="true">
      <Icon icon="mdi:play" width="22" height="22" />
    </span>
  </NuxtLink>
  <a
    v-else-if="href"
    :href="href"
    class="campus-video-thumb"
    :aria-label="title"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      v-if="thumb && !broken"
      :src="thumb"
      :alt="title"
      class="campus-video-thumb__img"
      loading="lazy"
      @error="broken = true"
    >
    <div v-else class="campus-video-thumb__fallback" aria-hidden="true">
      <Icon icon="mdi:play-circle-outline" width="42" height="42" />
    </div>
    <span class="campus-video-thumb__play" aria-hidden="true">
      <Icon icon="mdi:play" width="22" height="22" />
    </span>
  </a>
  <div
    v-else
    class="campus-video-thumb"
    :aria-label="title"
  >
    <img
      v-if="thumb && !broken"
      :src="thumb"
      :alt="title"
      class="campus-video-thumb__img"
      loading="lazy"
      @error="broken = true"
    >
    <div v-else class="campus-video-thumb__fallback" aria-hidden="true">
      <Icon icon="mdi:play-circle-outline" width="42" height="42" />
    </div>
    <span class="campus-video-thumb__play" aria-hidden="true">
      <Icon icon="mdi:play" width="22" height="22" />
    </span>
  </div>
</template>
