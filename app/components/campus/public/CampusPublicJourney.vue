<script setup lang="ts">
import { CAMPUS_PUBLIC_JOURNEY } from '~/data/campus-public-content'
</script>

<template>
  <section id="como-funciona" class="campus-public__section campus-public__section--alt">
    <div class="campus-public__container">
      <div class="campus-public__head campus-public__head--center">
        <span class="campus-public__kicker">Recorrido del participante</span>
        <h2 class="campus-public__title">Cómo funciona el Campus</h2>
        <p class="campus-public__lead">
          Un proceso claro en cuatro pasos, desde la exploración hasta la certificación.
        </p>
      </div>

      <ol class="journey-list">
        <li v-for="step in CAMPUS_PUBLIC_JOURNEY" :key="step.step" class="journey-step">
          <span class="journey-step__num">{{ step.step }}</span>
          <div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

