<script setup lang="ts">
import { SITE_HERO_POSTER, SITE_HERO_VIDEO, SITE_TRUST } from '~/data/site-content'
</script>

<template>
  <section class="site-hero">
    <video
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      :poster="SITE_HERO_POSTER"
      class="site-hero__video"
    >
      <source :src="SITE_HERO_VIDEO" type="video/mp4">
    </video>
    <div class="site-hero__overlay" />

    <div class="site-container site-hero__content">
      <div class="site-hero__copy">
        <p class="site-hero__kicker">Consultoría estratégica & desarrollo humano</p>
        <h1>Transformamos potencial en resultados</h1>
        <p class="site-hero__desc">
          Acompañamos a organizaciones, equipos y profesionales en procesos de
          transformación, liderazgo y crecimiento sostenible.
        </p>
        <div class="site-hero__actions">
          <a href="#contacto" class="public-btn public-btn--primary public-btn--lg">Solicitar asesoramiento</a>
          <a href="#servicios" class="public-btn public-btn--ghost public-btn--lg">Ver servicios</a>
        </div>
      </div>
    </div>
  </section>

  <div class="site-trust">
    <div class="site-container site-trust__grid">
      <article v-for="item in SITE_TRUST" :key="item.title" class="site-trust__item">
        <strong>{{ item.title }}</strong>
        <span>{{ item.text }}</span>
      </article>
    </div>
  </div>
</template>

