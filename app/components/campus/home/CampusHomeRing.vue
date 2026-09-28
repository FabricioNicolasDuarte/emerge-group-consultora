<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number
  size?: 'md' | 'lg'
  light?: boolean
}>(), {
  size: 'md',
  light: false,
})

const clamped = computed(() => Math.max(0, Math.min(100, Math.round(props.value))))
const radius = computed(() => (props.size === 'lg' ? 52 : 42))
const stroke = computed(() => (props.size === 'lg' ? 8 : 7))
const view = computed(() => radius.value * 2 + stroke.value * 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const offset = computed(() => circumference.value * (1 - clamped.value / 100))
</script>

<template>
  <svg
    class="home-ring"
    :class="{ 'home-ring--light': light, 'home-ring--lg': size === 'lg' }"
    :width="view"
    :height="view"
    :viewBox="`0 0 ${view} ${view}`"
    role="img"
    :aria-label="`Progreso ${clamped}%`"
  >
    <circle
      class="home-ring__track"
      :cx="view / 2"
      :cy="view / 2"
      :r="radius"
      fill="none"
      :stroke-width="stroke"
    />
    <g :transform="`rotate(-90 ${view / 2} ${view / 2})`">
      <circle
        class="home-ring__fill"
        :cx="view / 2"
        :cy="view / 2"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </g>
    <text
      :x="view / 2"
      :y="view / 2"
      text-anchor="middle"
      dominant-baseline="central"
      class="home-ring__text"
    >
      {{ clamped }}%
    </text>
  </svg>
</template>

<style scoped>
.home-ring__track {
  stroke: rgba(13, 44, 84, 0.1);
}

.home-ring__fill {
  stroke: var(--eg-accent, #f28c28);
  transition: stroke-dashoffset 0.55s ease;
}

.home-ring__text {
  font-size: 1.05rem;
  font-weight: 800;
  fill: var(--campus-ink);
  letter-spacing: -0.03em;
}

.home-ring--lg .home-ring__text {
  font-size: 1.35rem;
}

.home-ring--light .home-ring__track {
  stroke: rgba(255, 255, 255, 0.22);
}

.home-ring--light .home-ring__fill {
  stroke: #ffd09a;
}

.home-ring--light .home-ring__text {
  fill: #fff;
}
</style>
