<script setup lang="ts">

import type { AnnouncementMedia, PublicAnnouncement } from '~/types/comms'

import { sanitizeHtml } from '~/utils/sanitize-html'



const props = defineProps<{

  announcement: Pick<

    PublicAnnouncement,

    'title' | 'body' | 'body_html' | 'excerpt' | 'background_color' | 'accent_color' | 'cover_image_path' | 'layout_style' | 'is_pinned' | 'published_at' | 'media'

  >

  compact?: boolean

}>()



const { getAnnouncementMediaUrl } = useCampusComms()
const { colors } = useAppConfig()

const defaultBackground = colors.surface
const defaultAccent = colors.ink



const htmlContent = computed(() => {

  const raw = props.announcement.body_html || props.announcement.body || ''

  return sanitizeHtml(raw)

})



const coverUrl = computed(() => {

  if (!props.announcement.cover_image_path) return null

  return getAnnouncementMediaUrl(props.announcement.cover_image_path)

})



function mediaUrl(item: AnnouncementMedia) {

  return item.public_url || getAnnouncementMediaUrl(item.storage_path)

}



function formatDate(value: string | null | undefined) {

  if (!value) return ''

  return new Date(value).toLocaleDateString('es-AR', {

    day: 'numeric',

    month: 'long',

    year: 'numeric',

  })

}

</script>



<template>

  <article

    class="announcement-render"

    :class="[announcement.layout_style || 'card', { compact, pinned: announcement.is_pinned }]"

    :style="{

      backgroundColor: announcement.background_color || defaultBackground,

      '--accent': announcement.accent_color || defaultAccent,

    }"

  >

    <div v-if="announcement.is_pinned" class="pinned-badge">Destacado</div>



    <div v-if="coverUrl" class="cover">

      <img :src="coverUrl" :alt="announcement.title">

    </div>



    <div class="content">

      <header>

        <h2>{{ announcement.title }}</h2>

        <small v-if="announcement.published_at">{{ formatDate(announcement.published_at) }}</small>

        <p v-if="announcement.excerpt && compact" class="excerpt">{{ announcement.excerpt }}</p>

      </header>



      <div class="rich-body" v-html="htmlContent" />



      <div v-if="announcement.media?.length" class="media-gallery">

        <figure v-for="item in announcement.media" :key="item.id">

          <img v-if="item.media_type === 'image'" :src="mediaUrl(item)" :alt="item.title">

          <video v-else-if="item.media_type === 'video'" controls :src="mediaUrl(item)" />

          <a v-else :href="mediaUrl(item)" target="_blank" rel="noopener">{{ item.title || 'Descargar archivo' }}</a>

          <figcaption v-if="item.title">{{ item.title }}</figcaption>

        </figure>

      </div>

    </div>

  </article>

</template>



<style scoped>

.announcement-render {

  position: relative;

  border-radius: 20px;

  overflow: hidden;

  border: 1px solid rgba(13, 44, 84, 0.08);

  box-shadow: 0 16px 40px rgba(13, 44, 84, 0.08);

}



.announcement-render.pinned {

  border-color: rgba(242, 140, 40, 0.45);

}



.announcement-render.banner {

  display: grid;

  grid-template-columns: 1.1fr 1fr;

}



.announcement-render.fullscreen {

  min-height: 70vh;

  display: flex;

  flex-direction: column;

  justify-content: center;

}



.pinned-badge {

  position: absolute;

  top: 16px;

  right: 16px;

  z-index: 2;

  background: var(--eg-accent);

  color: var(--eg-surface);

  font-size: 11px;

  font-weight: 800;

  padding: 6px 10px;

  border-radius: 999px;

}



.cover img {

  width: 100%;

  height: 100%;

  object-fit: cover;

  min-height: 220px;

}



.content {

  padding: 28px;

}



.compact .content {

  padding: 20px;

}



header h2 {

  font-family: var(--eg-font-display);

  color: var(--accent);

  margin: 0 0 8px;

  font-size: clamp(24px, 3vw, 36px);

}



header small {

  color: var(--eg-subtle);

}



.excerpt {

  color: var(--eg-ink-soft);

  margin-top: 10px;

  line-height: 1.6;

}



.rich-body :deep(h1),

.rich-body :deep(h2),

.rich-body :deep(h3) {

  color: var(--accent);

  font-family: var(--eg-font-display);

}



.rich-body :deep(p),

.rich-body :deep(li) {

  line-height: 1.75;

  color: var(--eg-ink-soft);

}



.rich-body :deep(a) {

  color: var(--eg-action);

  font-weight: 700;

}



.rich-body :deep(img),

.rich-body :deep(video),

.rich-body :deep(iframe) {

  max-width: 100%;

  border-radius: 12px;

  margin: 14px 0;

}



.rich-body :deep(.announcement-icon) {

  display: inline-block;

  vertical-align: middle;

  margin: 4px 8px 4px 0;

}



.media-gallery {

  display: grid;

  gap: 16px;

  margin-top: 20px;

}



.media-gallery img,

.media-gallery video {

  width: 100%;

  border-radius: 12px;

}



.media-gallery figcaption {

  color: var(--eg-subtle);

  font-size: 13px;

  margin-top: 6px;

}



@media (max-width: 900px) {

  .announcement-render.banner {

    grid-template-columns: 1fr;

  }

}

</style>

