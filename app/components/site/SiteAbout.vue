<script setup lang="ts">
import { SITE_PILLARS } from '~/data/site-content'
</script>

<template>
  <section id="nosotros" class="site-section site-section--white">
    <div class="site-container">
      <div class="site-section__head">
        <span class="site-kicker">Quiénes somos</span>
        <h2 class="site-title">
          Acompañamos procesos que transforman personas, equipos y organizaciones
        </h2>
        <p class="site-lead">
          Integramos estrategia, coaching ontológico y formación para generar
          transformación profunda y sostenible.
        </p>
      </div>

      <div class="pillars">
        <article v-for="pillar in SITE_PILLARS" :key="pillar.title" class="pillar-card">
          <div class="pillar-card__image">
            <img :src="pillar.image" :alt="pillar.title" loading="lazy">
          </div>
          <div class="pillar-card__body">
            <h3>{{ pillar.title }}</h3>
            <p>{{ pillar.text }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

