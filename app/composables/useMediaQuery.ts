export function useMediaQuery(query: string) {
  const getMatch = () => {
    if (!import.meta.client || typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  }

  const matches = ref(getMatch())

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
