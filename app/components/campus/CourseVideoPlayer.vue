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
    <template v-if="embed.kind === 'youtube' || embed.kind === 'vimeo' || embed.kind === 'drive'">
      <iframe
        :src="embed.embedUrl"
        :title="title || 'Video de la clase'"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
      <a
        v-if="embed.kind === 'drive'"
        class="video-open-link"
        :href="embed.openUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir en Google Drive
      </a>
    </template>

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
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  background: var(--eg-ink);
  box-shadow: 0 18px 45px rgba(13, 44, 84, 0.18);
}

.video-open-link {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(13, 44, 84, 0.88);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}

.video-open-link:hover {
  background: var(--eg-accent);
  color: #fff;
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
  color: var(--eg-accent);
  font-size: 28px;
}

.video-placeholder small {
  color: rgba(255, 255, 255, 0.55);
  max-width: 320px;
  line-height: 1.5;
}
</style>
