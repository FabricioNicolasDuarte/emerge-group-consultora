<script setup lang="ts">
import type { CourseCatalogItem } from '~/types/academic'
import { formatProgramEnrollmentHint, formatProgramPriceLabel, formatProgramPublishedDate, formatProgramCohortDates, formatProgramSeatsHint, getProgramBadges } from '~/utils/programCatalog'

const props = defineProps<{
  programs: CourseCatalogItem[]
  loading: boolean
}>()

const programSearch = ref('')
const programCategory = ref('')

function programBadges(program: CourseCatalogItem) {
  return getProgramBadges(program, props.programs)
}

function programDate(program: CourseCatalogItem) {
  return formatProgramCohortDates(program) || formatProgramPublishedDate(program.created_at)
}

const categories = computed(() =>
  [...new Set(props.programs.map(p => p.category).filter(Boolean))].sort(),
)

const categoryOptions = computed(() => [
  { value: '', label: 'Todos' },
  ...categories.value.map(cat => ({ value: cat, label: cat })),
])

const filteredPrograms = computed(() => {
  let list = props.programs
  if (programCategory.value) {
    list = list.filter(p => p.category === programCategory.value)
  }
  const q = programSearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter(p =>
      p.title.toLowerCase().includes(q)
      || p.description.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q),
    )
  }
  return list
})
</script>

<template>
  <section id="programas" class="campus-public__section campus-public__section--alt">
    <div class="campus-public__container">
      <div class="campus-public__head">
        <span class="campus-public__kicker">Catálogo formativo</span>
        <h2 class="campus-public__title">Programas de formación</h2>
        <p class="campus-public__lead">
          Explorá las propuestas disponibles, filtrá por categoría y accedé al detalle de cada programa.
        </p>
      </div>

      <div class="campus-public__panel programs-panel">
        <div class="programs-toolbar">
          <input
            v-model="programSearch"
            type="search"
            class="programs-search"
            placeholder="Buscar por nombre o categoría…"
            aria-label="Buscar programa"
          >
          <CampusSegmented
            v-model="programCategory"
            :options="categoryOptions"
            aria-label="Filtrar por categoría"
            class="programs-categories"
          />
        </div>

        <div v-if="loading" class="programs-state">
          Cargando programas…
        </div>

        <div v-else-if="!programs.length" class="programs-state">
          Próximamente nuevos programas de formación.
        </div>

        <div v-else-if="!filteredPrograms.length" class="programs-state">
          No hay programas que coincidan con tu búsqueda.
        </div>

        <div v-else class="programs-grid">
          <article v-for="program in filteredPrograms" :key="program.id" class="program-card">
            <div class="program-card__top">
              <div class="program-card__badges">
                <span class="campus-public__tag">{{ program.category }}</span>
                <span
                  v-for="badge in programBadges(program)"
                  :key="badge.id"
                  class="program-card__badge"
                  :class="`program-card__badge--${badge.tone}`"
                >
                  {{ badge.label }}
                </span>
              </div>
              <time
                v-if="programDate(program)"
                class="program-card__date"
                :datetime="program.cohort_start_date || program.created_at"
              >
                {{ formatProgramCohortDates(program) ? programDate(program) : `Desde ${programDate(program)}` }}
              </time>
            </div>
            <h3>{{ program.title }}</h3>
            <p>{{ program.description }}</p>
            <div class="program-card__meta">
              <span>{{ program.module_count }} módulos</span>
              <span
                v-if="formatProgramSeatsHint(program)"
                class="program-card__enrollment"
              >
                {{ formatProgramSeatsHint(program) }}
              </span>
              <span
                v-else-if="formatProgramEnrollmentHint(program.enrollment_count)"
                class="program-card__enrollment"
              >
                {{ formatProgramEnrollmentHint(program.enrollment_count) }}
              </span>
              <span class="program-card__price">
                {{ formatProgramPriceLabel(program.price_amount, program.price_currency ?? 'ARS') }}
              </span>
            </div>
            <NuxtLink
              :to="`/campus/cursos/${program.slug}`"
              class="public-btn public-btn--primary public-btn--sm program-card__link"
            >
              Ver programa
            </NuxtLink>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

