/**
 * Syncs app.config colors onto :root for runtime/theming consistency.
 * CSS tokens in tokens.css remain the compile-time source for stylesheets.
 */
export function useAppColors() {
  const { colors } = useAppConfig()

  useHead({
    style: [
      {
        innerHTML: `:root {
          --eg-accent: ${colors.accent};
          --eg-accent-hover: ${colors.accentHover};
          --eg-action: ${colors.action};
          --eg-action-hover: ${colors.actionHover};
          --eg-ink: ${colors.ink};
          --eg-muted: ${colors.muted};
          --eg-surface: ${colors.surface};
          --eg-bg: ${colors.bg};
        }`,
      },
    ],
  })

  return { colors }
}
