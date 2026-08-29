<script setup lang="ts">
import { parseVideoUrl } from '~/utils/video'

const props = defineProps<{
  url: string | null | undefined
  title?: string
}>()

const embed = computed(() => parseVideoUrl(props.url))
</script>

<template>
  <div class="video-player">
    <iframe
      v-if="embed.kind === 'youtube' || embed.kind === 'vimeo'"
      :src="embed.embedUrl"
      :title="title || 'Video de la clase'"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />

    <video
      v-else-if="embed.kind === 'direct'"
      :src="embed.src"
      controls
      playsinline
      preload="metadata"
    />

    <div v-else class="video-placeholder">
      <div class="play-icon">▶</div>
      <span>Video no disponible</span>
      <small>El docente aún no cargó el video de esta clase.</small>
    </div>
  </div>
</template>

<style scoped>
.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  background: #0D2C54;
  box-shadow: 0 18px 45px rgba(13, 44, 84, 0.18);
}

.video-player iframe,
.video-player video {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  object-fit: contain;
  background: #000;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  padding: 24px;
}

.play-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(242, 140, 40, 0.2);
  color: #F28C28;
  font-size: 28px;
}

.video-placeholder small {
  color: rgba(255, 255, 255, 0.55);
  max-width: 320px;
  line-height: 1.5;
}
</style>
