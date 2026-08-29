/**
 * Ejecuta `fn` al montar, al volver el foco a la pestaña y cada `intervalMs`.
 */
export function useCampusAutoRefresh(
  fn: () => void | Promise<void>,
  intervalMs = 60_000,
) {
  let timer: ReturnType<typeof setInterval> | null = null

  async function run() {
    await fn()
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') {
      run()
    }
  }

  onMounted(() => {
    run()
    if (import.meta.client) {
      timer = setInterval(run, intervalMs)
      window.addEventListener('focus', run)
      document.addEventListener('visibilitychange', onVisibility)
    }
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    if (import.meta.client) {
      window.removeEventListener('focus', run)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })
}
