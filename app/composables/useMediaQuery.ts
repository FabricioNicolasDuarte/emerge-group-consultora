export function useMediaQuery(query: string) {
  const matches = ref(false)

  onMounted(() => {
    if (!import.meta.client) return
    const media = window.matchMedia(query)
    const sync = () => {
      matches.value = media.matches
    }
    sync()
    media.addEventListener('change', sync)
    onBeforeUnmount(() => media.removeEventListener('change', sync))
  })

  return matches
}
