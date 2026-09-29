<script setup lang="ts">
import { parseVideoUrl, videoThumbnailUrl } from '~/utils/video'

const props = defineProps<{
  url: string | null | undefined
  title?: string
}>()

const embed = computed(() => parseVideoUrl(props.url))
const thumb = computed(() => videoThumbnailUrl(props.url))

/** native → iframe → open Drive */
const driveMode = ref<'native' | 'iframe' | 'failed'>('native')
const driveNativeFailed = ref(false)

watch(() => props.url, () => {
  driveMode.value = 'native'
  driveNativeFailed.value = false
})

function onDriveVideoError() {
  driveNativeFailed.value = true
  driveMode.value = 'iframe'
}
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
        loading="lazy"
      />
    </template>

    <template v-else-if="embed.kind === 'drive'">
      <video
        v-if="driveMode === 'native'"
        :src="embed.streamUrl"
        :poster="thumb || undefined"
        controls
        playsinline
        webkit-playsinline
        preload="metadata"
        referrerpolicy="no-referrer"
        @error="onDriveVideoError"
      />

      <iframe
        v-else-if="driveMode === 'iframe'"
        :src="embed.embedUrl"
        :title="title || 'Video de la clase'"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowfullscreen
        playsinline
        loading="eager"
      />

      <div
        v-else
        class="video-player__drive-fallback"
      >
        <img
          v-if="thumb"
          :src="thumb"
          :alt="title || 'Video'"
          class="video-player__drive-poster"
        >
        <div class="video-player__drive-panel">
          <div class="play-icon">▶</div>
          <strong>{{ title || 'Video de la clase' }}</strong>
          <p>
            No se pudo reproducir dentro del campus.
            Abrí el archivo en Google Drive (debe estar compartido como “Cualquiera con el enlace”).
          </p>
          <a
            class="video-drive-btn"
            :href="embed.openUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en Google Drive
          </a>
        </div>
      </div>

      <div
        v-if="driveMode === 'iframe'"
        class="video-player__drive-actions"
      >
        <a
          class="video-open-link"
          :href="embed.openUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir en Drive
        </a>
        <button
          v-if="driveNativeFailed"
          type="button"
          class="video-open-link video-open-link--alt"
          @click="driveMode = 'failed'"
        >
          ¿No carga?
        </button>
      </div>
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
      <small v-if="url">
        No pudimos reconocer el enlace.
        <a :href="url" target="_blank" rel="noopener noreferrer">Abrir enlace original</a>
      </small>
      <small v-else>
        Esta clase no tiene enlace de video guardado (YouTube, Vimeo o Drive).
        En Contenido del curso → Editar clase → pegá la URL del video.
      </small>
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

.video-player__drive-actions {
  position: absolute;
  inset: auto 12px 12px 12px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  pointer-events: none;
}

.video-open-link {
  pointer-events: auto;
  padding: 8px 12px;
  border-radius: 999px;
  border: none;
  background: rgba(13, 44, 84, 0.88);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.video-open-link--alt {
  margin-right: auto;
}

.video-open-link:hover {
  background: var(--eg-accent);
  color: #fff;
}

.video-player iframe,
.video-player video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  object-fit: contain;
  background: #000;
}

.video-player__drive-fallback {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  display: grid;
  place-items: center;
  background: #0a1628;
}

.video-player__drive-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.45;
}

.video-player__drive-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.92);
}

.video-player__drive-panel p {
  margin: 0;
  max-width: 340px;
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

.video-placeholder a {
  color: #ffd09a;
  font-weight: 700;
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
  .video-player {
    /* Keep 16:9 — aspect-ratio:auto + min-height left the <video> ~80px tall. */
    min-height: 200px;
  }
}
</style>
