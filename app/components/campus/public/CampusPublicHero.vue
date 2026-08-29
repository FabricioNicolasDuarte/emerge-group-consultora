<script setup lang="ts">
import {
  CAMPUS_PUBLIC_HERO_POSTER,
  CAMPUS_PUBLIC_HERO_VIDEO,
  CAMPUS_PUBLIC_TRUST,
} from '~/data/campus-public-content'

const { brand } = useAppBrand()
</script>

<template>
  <section id="inicio" class="cp-hero">
    <video
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      :poster="CAMPUS_PUBLIC_HERO_POSTER"
      class="cp-hero__video"
    >
      <source :src="CAMPUS_PUBLIC_HERO_VIDEO" type="video/mp4">
    </video>
    <div class="cp-hero__backdrop" aria-hidden="true" />
    <div class="campus-public__container cp-hero__content">
      <p class="cp-hero__kicker">{{ brand.name }}</p>
      <h1>Campus <strong>Emerge</strong></h1>
      <p class="cp-hero__tagline">Formación para transformar conocimiento en acción</p>
      <p class="cp-hero__desc">
        Un espacio de aprendizaje para personas, equipos y organizaciones que buscan
        desarrollar competencias, potenciar su liderazgo y prepararse para los desafíos del presente.
      </p>
      <div class="cp-hero__actions">
        <a href="#programas" class="public-btn public-btn--primary public-btn--lg">
          Explorar programas
        </a>
        <NuxtLink to="/campus/login" class="public-btn public-btn--ghost public-btn--lg">
          Ingresar al Campus
        </NuxtLink>
      </div>
    </div>
  </section>

  <div class="cp-trust">
    <div class="campus-public__container cp-trust__grid">
      <article v-for="item in CAMPUS_PUBLIC_TRUST" :key="item.title">
        <strong>{{ item.title }}</strong>
        <span>{{ item.text }}</span>
      </article>
    </div>
  </div>
</template>
