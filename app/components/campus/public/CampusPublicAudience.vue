<script setup lang="ts">
import { CAMPUS_PUBLIC_AUDIENCE } from '~/data/campus-public-content'

const activeId = ref(CAMPUS_PUBLIC_AUDIENCE[0].id)

const switchOptions = computed(() =>
  CAMPUS_PUBLIC_AUDIENCE.map(item => ({ value: item.id, label: item.label })),
)

const activeAudience = computed(() =>
  CAMPUS_PUBLIC_AUDIENCE.find(item => item.id === activeId.value) ?? CAMPUS_PUBLIC_AUDIENCE[0],
)
</script>

<template>
  <section id="para-quien" class="campus-public__section campus-public__section--dark">
    <div class="campus-public__container">
      <div class="campus-public__head campus-public__head--center audience-head">
        <span class="campus-public__kicker audience-kicker">Público</span>
        <h2 class="campus-public__title audience-title">¿Para quién es el Campus?</h2>
        <p class="campus-public__lead audience-lead">
          Formación pensada para distintos perfiles y contextos de aprendizaje.
        </p>
      </div>

      <div class="campus-public__panel campus-public__panel--dark audience-panel">
        <CampusSegmented
          v-model="activeId"
          :options="switchOptions"
          aria-label="Perfil de participante"
          class="audience-switch"
        />

        <div class="audience-body">
          <div>
            <h3>{{ activeAudience.title }}</h3>
            <p>{{ activeAudience.text }}</p>
            <ul>
              <li v-for="item in activeAudience.highlights" :key="item">{{ item }}</li>
            </ul>
            <a href="#programas" class="public-btn public-btn--primary">
              Ver programas para {{ activeAudience.label.toLowerCase() }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

