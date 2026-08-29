<script setup lang="ts">
import { SITE_TEAM } from '~/data/site-content'
</script>

<template>
  <section id="quien-forma" class="public-section public-section--white">
    <div class="public-container">
      <div class="public-section__head public-section__head--center">
        <span class="public-kicker">Equipo</span>
        <h2 class="public-title">Quién forma en el Campus</h2>
        <p class="public-lead">
          Programas diseñados y facilitados por profesionales de EmergeGroup con trayectoria
          en consultoría, coaching ontológico y desarrollo organizacional.
        </p>
      </div>

      <div class="faculty-grid">
        <article v-for="member in SITE_TEAM" :key="member.name" class="faculty-card">
          <div class="faculty-card__image">
            <img :src="member.image" :alt="member.name" loading="lazy" width="320" height="320">
          </div>
          <div class="faculty-card__body">
            <h3>{{ member.name }}</h3>
            <p class="faculty-card__role">{{ member.role }}</p>
            <p class="faculty-card__bio">{{ member.bio }}</p>
            <ul class="faculty-card__tags">
              <li v-for="tag in member.tags" :key="tag">{{ tag }}</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
