const open = useState('campus-support-open', () => false)

export function useCampusSupport() {
  function openSupport() {
    open.value = true
  }

  function closeSupport() {
    open.value = false
  }

  return {
    open,
    openSupport,
    closeSupport,
  }
}
