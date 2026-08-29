import { useCampusPanelHome } from '~/composables/useCampusPanelHome'

export function useCampusBackLink() {
  const { homePath, homeLabel } = useCampusPanelHome()

  return {
    panelPath: homePath,
    panelLabel: homeLabel,
  }
}
