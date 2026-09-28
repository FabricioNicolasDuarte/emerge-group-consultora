<script setup lang="ts">
import { resolveCampusHelp } from '~/data/campus-help'

const route = useRoute()
const { openSupport } = useCampusSupport()
const open = ref(false)

const help = computed(() => resolveCampusHelp(route.path))
</script>

<template>
  <Teleport to="body">
    <div class="campus-help-notch" :class="{ 'is-open': open }">
      <button
        type="button"
        class="campus-help-notch__tab"
        :aria-expanded="open"
        aria-controls="campus-help-panel"
        :title="open ? 'Cerrar ayuda' : 'Ayuda de esta pantalla'"
        @click="open = !open"
      >
        ?
      </button>

      <aside
        id="campus-help-panel"
        class="campus-help-notch__panel campus-glass"
        :hidden="!open"
        aria-label="Ayuda contextual"
      >
        <header class="campus-help-notch__head">
          <span class="campus-help-notch__eyebrow">Guía rápida</span>
          <h3>{{ help.title }}</h3>
          <p>{{ help.summary }}</p>
        </header>
        <ol class="campus-help-notch__steps">
          <li v-for="(step, i) in help.steps" :key="i">{{ step }}</li>
        </ol>
        <p class="campus-help-notch__hint">
          ¿Seguís con un problema?
          <button type="button" class="campus-help-notch__link" @click="openSupport()">
            Abrir soporte técnico
          </button>
        </p>
      </aside>
    </div>
  </Teleport>
</template>
