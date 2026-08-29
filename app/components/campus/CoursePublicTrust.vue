<script setup lang="ts">
import { CAMPUS_PUBLIC_TRUST } from '~/data/campus-public-content'
import { SITE_TESTIMONIALS } from '~/data/site-content'

const featuredTestimonials = SITE_TESTIMONIALS.slice(0, 2)
</script>

<template>
  <section class="course-trust" aria-label="Confianza y experiencias">
    <div class="course-trust__pillars">
      <article v-for="item in CAMPUS_PUBLIC_TRUST" :key="item.title" class="course-trust__pillar">
        <strong>{{ item.title }}</strong>
        <span>{{ item.text }}</span>
      </article>
    </div>

    <div class="course-trust__quotes">
      <blockquote
        v-for="item in featuredTestimonials"
        :key="item.author"
        class="course-trust__quote"
      >
        <p>“{{ item.quote }}”</p>
        <footer>
          <cite>{{ item.author }}</cite>
          <span>{{ item.context }}</span>
        </footer>
      </blockquote>
    </div>
  </section>
</template>
