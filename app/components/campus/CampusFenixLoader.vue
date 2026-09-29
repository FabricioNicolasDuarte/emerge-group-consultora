<script setup lang="ts">
import { FENIX_LOADER_SRC } from '~/composables/useCampusFenixLoader'

const visible = useCampusFenixVisible()
const videoRef = ref<HTMLVideoElement | null>(null)

watch(visible, async (show) => {
  if (!import.meta.client) return
  await nextTick()
  const el = videoRef.value
  if (!el) return
  if (show) {
    el.currentTime = 0
    const play = el.play()
    if (play && typeof play.catch === 'function') play.catch(() => {})
  } else {
    el.pause()
  }
}, { flush: 'post' })
</script>

<template>
  <Teleport to="body">
    <Transition name="fenix-fade">
      <div
        v-if="visible"
        class="fenix-loader"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Cargando Campus"
      >
        <video
          ref="videoRef"
          class="fenix-loader__video"
          :src="FENIX_LOADER_SRC"
          muted
          playsinline
          loop
          autoplay
          preload="auto"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fenix-loader {
  position: fixed;
  inset: 0;
  z-index: 12000;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  /* Evita que el loader “coma” clics del player al terminar de cargar */
  pointer-events: auto;
}

.fenix-loader__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  /* El blanco del video se vuelve translúcido sobre el fondo */
  mix-blend-mode: multiply;
}

.fenix-fade-enter-active,
.fenix-fade-leave-active {
  transition: opacity 0.35s ease;
}

.fenix-fade-enter-from,
.fenix-fade-leave-to {
  opacity: 0;
}
</style>
