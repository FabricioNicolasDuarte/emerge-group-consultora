<script setup lang="ts">
import { CAMPUS_PUBLIC_PILLARS } from '~/data/campus-public-content'
</script>

<template>
  <section id="sobre-campus" class="campus-public__section campus-public__section--white">
    <div class="campus-public__container">
      <div class="campus-public__head">
        <span class="campus-public__kicker">Sobre el Campus</span>
        <h2 class="campus-public__title">Aprender para transformar</h2>
        <p class="campus-public__lead">
          Campus Emerge es el espacio de formación de EmergeGroup Consultora, creado para
          acompañar el desarrollo de competencias que se convierten en acciones y resultados.
        </p>
      </div>

      <div class="campus-public__grid-3">
        <article v-for="pillar in CAMPUS_PUBLIC_PILLARS" :key="pillar.title" class="pillar-card">
          <span class="pillar-card__num">{{ pillar.step }}</span>
          <h3>{{ pillar.title }}</h3>
          <p>{{ pillar.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

