export function useAppContact() {
  const { contact } = useAppConfig()

  const whatsappHref = computed(() => {
    const text = encodeURIComponent(contact.whatsappMessage)
    return `https://wa.me/${contact.whatsapp}?text=${text}`
  })

  const emailHref = computed(() =>
    `mailto:${contact.email}?subject=${encodeURIComponent('Consulta EmergeGroup')}&body=${encodeURIComponent('Hola, quiero información sobre sus servicios.')}`,
  )

  return { contact, whatsappHref, emailHref }
}
