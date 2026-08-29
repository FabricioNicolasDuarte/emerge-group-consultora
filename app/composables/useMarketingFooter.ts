/**
 * Footer visible only on marketing / discovery routes.
 * Hidden on panel, auth, course player, and transactional flows.
 */
export function useMarketingFooter() {
  const route = useRoute()

  const showFooter = computed(() => {
    const path = route.path

    if (path === '/') return true
    if (path === '/campus') return true
    if (path.startsWith('/campus/anuncios/')) return true
    if (path.startsWith('/campus/certificados/')) return true

    // Public course catalog page (not lesson player)
    if (/^\/campus\/cursos\/[^/]+$/.test(path)) return true

    return false
  })

  return { showFooter }
}
