<script setup lang="ts">
export interface CampusChartBar {
  label: string
  value: number
  color?: string
}

const props = defineProps<{
  bars: CampusChartBar[]
  max?: number
}>()

const maxValue = computed(() => {
  if (props.max != null) return props.max
  const peak = Math.max(...props.bars.map((b) => b.value), 1)
  return peak
})
</script>

<template>
  <div class="mini-chart" role="img" :aria-label="`Gráfico de barras con ${bars.length} valores`">
    <div
      v-for="bar in bars"
      :key="bar.label"
      class="mini-chart__row"
    >
      <span class="mini-chart__label">{{ bar.label }}</span>
      <div class="mini-chart__track">
        <div
          class="mini-chart__fill"
          :style="{
            width: `${Math.round((bar.value / maxValue) * 100)}%`,
            ...(bar.color ? { background: bar.color } : {}),
          }"
        />
      </div>
      <span class="mini-chart__value">{{ bar.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.mini-chart {
  display: grid;
  gap: 0.65rem;
}

.mini-chart__row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 1fr auto;
  align-items: center;
  gap: 0.55rem;
}

.mini-chart__label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--campus-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-chart__track {
  height: 8px;
  border-radius: 999px;
  background: rgba(13, 44, 84, 0.08);
  overflow: hidden;
}

.mini-chart__fill {
  height: 100%;
  border-radius: 999px;
  min-width: 4px;
  background: linear-gradient(90deg, var(--eg-action), var(--eg-accent));
  transition: width 0.4s var(--campus-ease, ease);
}

.mini-chart__value {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--campus-ink);
  min-width: 1.5rem;
  text-align: right;
}
</style>
