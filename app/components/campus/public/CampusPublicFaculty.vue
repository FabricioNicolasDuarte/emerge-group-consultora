<script setup lang="ts">
import { CAMPUS_FACULTY } from '~/data/campus-public-content'

const { brand } = useAppBrand()
</script>

<template>
  <section id="quien-forma" class="public-section public-section--white">
    <div class="public-container">
      <div class="public-section__head public-section__head--center">
        <span class="public-kicker">Equipo</span>
        <h2 class="public-title">Quién forma en el Campus</h2>
        <p class="public-lead">
          Programas diseñados y facilitados por profesionales de {{ brand.shortName }} con trayectoria
          en consultoría, coaching ontológico y desarrollo organizacional.
        </p>
      </div>

      <div class="team-panel public-panel">
        <article v-for="member in CAMPUS_FACULTY" :key="member.name" class="team-card">
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
              <span v-for="tag in member.tags" :key="tag" class="public-tag">{{ tag }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
