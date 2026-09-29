/**
 * Fenix video loader for slow campus loads.
 * - Appears only if loading lasts longer than SHOW_AFTER_MS
 * - Once visible, stays at least MIN_VISIBLE_MS
 * - Fast loads never show it
 */

export const FENIX_LOADER_SRC = '/brand/fenix-loading.mp4'
export const FENIX_SHOW_AFTER_MS = 450
export const FENIX_MIN_VISIBLE_MS = 5000

type FenixController = {
  busyCount: number
  delayTimer: ReturnType<typeof setTimeout> | null
  hideTimer: ReturnType<typeof setTimeout> | null
  shownAt: number
}

const ctrl: FenixController = {
  busyCount: 0,
  delayTimer: null,
  hideTimer: null,
  shownAt: 0,
}

export function useCampusFenixVisible() {
  return useState('campus-fenix-visible', () => false)
}

function clearDelay() {
  if (ctrl.delayTimer) {
    clearTimeout(ctrl.delayTimer)
    ctrl.delayTimer = null
  }
}

function clearHide() {
  if (ctrl.hideTimer) {
    clearTimeout(ctrl.hideTimer)
    ctrl.hideTimer = null
  }
}

function beginFenixBusy() {
  if (!import.meta.client) return
  const visible = useCampusFenixVisible()
  ctrl.busyCount += 1
  clearHide()

  if (ctrl.busyCount === 1 && !visible.value) {
    clearDelay()
    ctrl.delayTimer = setTimeout(() => {
      ctrl.delayTimer = null
      if (ctrl.busyCount <= 0) return
      visible.value = true
      ctrl.shownAt = Date.now()
    }, FENIX_SHOW_AFTER_MS)
  }
}

function endFenixBusy() {
  if (!import.meta.client) return
  const visible = useCampusFenixVisible()
  ctrl.busyCount = Math.max(0, ctrl.busyCount - 1)
  if (ctrl.busyCount > 0) return

  clearDelay()

  if (!visible.value) {
    ctrl.shownAt = 0
    return
  }

  const elapsed = Date.now() - ctrl.shownAt
  const remaining = Math.max(0, FENIX_MIN_VISIBLE_MS - elapsed)
  clearHide()
  ctrl.hideTimer = setTimeout(() => {
    ctrl.hideTimer = null
    if (ctrl.busyCount > 0) return
    visible.value = false
    ctrl.shownAt = 0
  }, remaining)
}

/**
 * Track a boolean loading flag. Only slow loads surface the Fenix overlay.
 */
export function useTrackFenixLoader(loading: MaybeRefOrGetter<boolean>) {
  if (import.meta.server) return

  let tracking = false

  function sync(isLoading: boolean) {
    if (isLoading && !tracking) {
      tracking = true
      beginFenixBusy()
      return
    }
    if (!isLoading && tracking) {
      tracking = false
      endFenixBusy()
    }
  }

  watch(
    () => toValue(loading),
    (isLoading) => sync(Boolean(isLoading)),
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (tracking) {
      tracking = false
      endFenixBusy()
    }
  })
}
