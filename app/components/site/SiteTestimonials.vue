<script setup lang="ts">
import { SITE_TESTIMONIALS } from '~/data/site-content'
</script>

<template>
  <section class="site-section site-section--white">
    <div class="site-container">
      <div class="site-section__head site-section__head--center">
        <span class="site-kicker">Experiencias</span>
        <h2 class="site-title">Lo que nuestros procesos generan</h2>
      </div>

      <div class="testimonials">
        <blockquote v-for="item in SITE_TESTIMONIALS" :key="item.author" class="testimonial">
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

