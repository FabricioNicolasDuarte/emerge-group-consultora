/**
 * Flags de funcionalidades según variables de entorno del servidor.
 */
export function useCampusFeatures() {
  const config = useRuntimeConfig()

  const paymentsEnabled = computed(() => Boolean(config.public.paymentsEnabled))

  return {
    paymentsEnabled,
  }
}
