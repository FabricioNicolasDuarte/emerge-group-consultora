<script setup lang="ts">
const props = withDefaults(defineProps<{
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
}>(), {
  name: '',
  src: null,
  size: 'md',
})

const broken = ref(false)

watch(() => props.src, () => {
  broken.value = false
})

const initials = computed(() => {
  const name = (props.name || '').trim()
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const showImage = computed(() => Boolean(props.src) && !broken.value)
</script>

<template>
  <span
    class="campus-avatar"
    :class="`campus-avatar--${size}`"
    :aria-hidden="true"
  >
    <img
      v-if="showImage"
      :src="src!"
      :alt="name || 'Avatar'"
      class="campus-avatar__img"
      loading="lazy"
      @error="broken = true"
    >
    <span v-else class="campus-avatar__fallback">{{ initials }}</span>
  </span>
</template>

<style scoped>
.campus-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--eg-ink), var(--eg-action));
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
  line-height: 1;
}

.campus-avatar--sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 0.72rem;
}

.campus-avatar--md {
  width: 44px;
  height: 44px;
  font-size: 0.9rem;
}

.campus-avatar--lg {
  width: 96px;
  height: 96px;
  border-radius: 22px;
  font-size: 1.6rem;
}

.campus-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.campus-avatar__fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}
</style>
