<script setup lang="ts">
import { SITE_ORGANIZATIONS } from '~/data/site-content'

const activeId = ref(SITE_ORGANIZATIONS[0].id)

const activeOrg = computed(() =>
  SITE_ORGANIZATIONS.find(org => org.id === activeId.value) ?? SITE_ORGANIZATIONS[0],
)

const switchOptions = computed(() =>
  SITE_ORGANIZATIONS.map(org => ({ id: org.id, label: org.label })),
)
</script>

<template>
  <section id="organizaciones" class="site-section site-section--white">
    <div class="site-container">
      <div class="site-section__head site-section__head--center">
        <span class="site-kicker">A quién acompañamos</span>
        <h2 class="site-title">Organizaciones y contextos</h2>
        <p class="site-lead">
          Adaptamos cada intervención al tipo de organización, su cultura y los desafíos concretos del momento.
        </p>
      </div>

      <div class="org-panel site-panel">
        <SiteSegmentSwitch
          v-model="activeId"
          :options="switchOptions"
          full-width
          class="org-panel__switch"
        />

        <div class="org-panel__body">
          <div class="org-panel__content">
            <h3>{{ activeOrg.title }}</h3>
            <p>{{ activeOrg.text }}</p>
            <ul class="org-panel__list">
              <li v-for="item in activeOrg.highlights" :key="item">
                {{ item }}
              </li>
            </ul>
            <a href="#contacto" class="public-btn public-btn--primary">
              Consultar para {{ activeOrg.label.toLowerCase() }}
            </a>
          </div>

          <div class="org-panel__aside">
            <div class="org-stat">
              <span class="org-stat__num">4</span>
              <span class="org-stat__label">Ámbitos de intervención</span>
            </div>
            <div class="org-stat">
              <span class="org-stat__num">100%</span>
              <span class="org-stat__label">Procesos personalizados</span>
            </div>
            <div class="org-stat">
              <span class="org-stat__num">360°</span>
              <span class="org-stat__label">Mirada integral</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

