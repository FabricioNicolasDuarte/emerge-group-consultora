<script setup lang="ts">
import { SITE_METHOD } from '~/data/site-content'
</script>

<template>
  <section id="metodologia" class="site-section site-section--white">
    <div class="site-container">
      <div class="site-section__head">
        <span class="site-kicker">Nuestro modo de trabajo</span>
        <h2 class="site-title">¿Cómo acompañamos?</h2>
        <p class="site-lead">
          Diseñamos procesos a medida integrando mirada estratégica, conversaciones
          poderosas y seguimiento profesional.
        </p>
      </div>

      <div class="method-panel site-panel">
        <ol class="method-list">
          <li v-for="step in SITE_METHOD" :key="step.step" class="method-step">
            <span class="method-step__num">{{ step.step }}</span>
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </div>
          </li>
        </ol>

        <blockquote class="method-quote">
          Las organizaciones cambian cuando cambian las conversaciones que las sostienen.
        </blockquote>
      </div>
    </div>
  </section>
</template>

