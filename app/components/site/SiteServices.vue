<script setup lang="ts">
import { SITE_SERVICE_CATEGORIES, SITE_SERVICES } from '~/data/site-content'

const activeCategory = ref<string>('all')

const categoryLabels: Record<string, string> = {
  organizacional: 'Organizacional',
  liderazgo: 'Liderazgo',
  institucional: 'Institucional',
  educativo: 'Educativo',
}

const switchOptions = computed(() =>
  SITE_SERVICE_CATEGORIES.map(cat => ({ id: cat.id, label: cat.label })),
)

const filteredServices = computed(() =>
  activeCategory.value === 'all'
    ? SITE_SERVICES
    : SITE_SERVICES.filter(s => s.category === activeCategory.value),
)
</script>

<template>
  <section id="servicios" class="site-section site-section--alt">
    <div class="site-container">
      <div class="site-section__head">
        <span class="site-kicker">Áreas de intervención</span>
        <h2 class="site-title">Servicios</h2>
        <p class="site-lead">
          Propuestas de acompañamiento, capacitación y consultoría según el momento,
          el desafío y los objetivos de cada organización.
        </p>
      </div>

      <div class="services-panel site-panel">
        <SiteSegmentSwitch
          v-model="activeCategory"
          :options="switchOptions"
          class="services-panel__switch"
        />

        <div class="services-grid">
          <article
            v-for="service in filteredServices"
            :key="service.title"
            class="site-card site-card--hover"
          >
            <span class="site-card__tag">{{ categoryLabels[service.category] }}</span>
            <h3>{{ service.title }}</h3>
            <p>{{ service.text }}</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

