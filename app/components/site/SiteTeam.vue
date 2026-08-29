<script setup lang="ts">
import { SITE_TEAM } from '~/data/site-content'
</script>

<template>
  <section id="equipo" class="site-section site-section--alt">
    <div class="site-container">
      <div class="site-section__head site-section__head--center">
        <span class="site-kicker">Nuestro equipo</span>
        <h2 class="site-title">Personas que integran miradas</h2>
        <p class="site-lead">
          Coaching, educación, liderazgo, comunicación institucional y desarrollo organizacional.
        </p>
      </div>

      <div class="team-panel site-panel">
        <article v-for="member in SITE_TEAM" :key="member.name" class="team-card">
          <div class="team-card__media">
            <img :src="member.image" :alt="member.name" loading="lazy">
          </div>
          <div class="team-card__body">
            <div class="team-card__header">
              <div>
                <h3>{{ member.name }}</h3>
                <span class="team-card__role">{{ member.role }}</span>
              </div>
            </div>
            <p class="team-card__bio">{{ member.bio }}</p>
            <div class="team-card__tags">
              <span v-for="tag in member.tags" :key="tag" class="site-tag">{{ tag }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

