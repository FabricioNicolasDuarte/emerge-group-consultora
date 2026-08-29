import { panelHomeLabel, panelHomePath } from '~/utils/campus-panel-paths'

export function useCampusPanelHome() {
  const { activePanel } = useCampusActivePanel()

  const homePath = computed(() => panelHomePath(activePanel.value))
  const homeLabel = computed(() => panelHomeLabel(activePanel.value))

  return { homePath, homeLabel, activePanel }
}
