<script setup lang="ts">
import { SITE_TESTIMONIALS } from '~/data/site-content'

const { brand } = useAppBrand()
</script>

<template>
  <section class="public-section public-section--white">
    <div class="public-container">
      <div class="public-section__head public-section__head--center">
        <span class="public-kicker">Experiencias</span>
        <h2 class="public-title">Lo que generan nuestros procesos</h2>
        <p class="public-lead">
          Organizaciones y equipos que confiaron en {{ brand.shortName }} para su desarrollo.
        </p>
      </div>

      <div class="testimonials-grid">
        <blockquote v-for="item in SITE_TESTIMONIALS" :key="item.author" class="testimonial-card">
          <p>{{ item.quote }}</p>
          <footer>
            <strong>{{ item.author }}</strong>
            <span>{{ item.context }}</span>
          </footer>
        </blockquote>
      </div>
    </div>
  </section>
</template>

