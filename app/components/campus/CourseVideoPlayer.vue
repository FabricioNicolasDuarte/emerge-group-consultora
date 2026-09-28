<script setup lang="ts">
import { parseVideoUrl } from '~/utils/video'

const props = defineProps<{
  url: string | null | undefined
  title?: string
}>()

const embed = computed(() => parseVideoUrl(props.url))
const isDesktop = useMediaQuery('(min-width: 769px)')
</script>

<template>
  <div
    class="video-player"
    :class="{ 'video-player--drive': embed.kind === 'drive' }"
  >
    <template v-if="embed.kind === 'youtube' || embed.kind === 'vimeo'">
      <iframe
        :src="embed.embedUrl"
        :title="title || 'Video de la clase'"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowfullscreen
        playsinline
      />
    </template>

    <template v-else-if="embed.kind === 'drive'">
      <iframe
        v-if="isDesktop"
        :src="embed.embedUrl"
        :title="title || 'Video de la clase'"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowfullscreen
        playsinline
      />
      <div v-else class="video-player__drive-mobile">
        <div class="play-icon">▶</div>
        <strong>{{ title || 'Video de la clase' }}</strong>
        <p>En el celular, el video se abre en Google Drive para una mejor reproducción.</p>
        <a
          class="video-drive-btn"
          :href="embed.openUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver video en Google Drive
        </a>
      </div>
      <a
        v-if="isDesktop"
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
      webkit-playsinline
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

.video-player__drive-mobile {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}

.video-player__drive-mobile p {
  margin: 0;
  max-width: 280px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
}

.video-drive-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 12px 18px;
  border-radius: 999px;
  background: var(--eg-accent);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
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

@media (max-width: 768px) {
  .video-player--drive {
    aspect-ratio: auto;
    min-height: 280px;
  }
}
</style>
