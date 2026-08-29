export function useAppContact() {
  const { contact, brand } = useAppConfig()
  const runtime = useRuntimeConfig()

  const email = computed(() => {
    const fromEnv = String(runtime.public.contactEmail || '').trim()
    return fromEnv || contact.email
  })

  const whatsappNumber = computed(() => {
    const fromEnv = String(runtime.public.contactWhatsapp || '').trim()
    return fromEnv || contact.whatsapp
  })

  function buildWhatsappHref(
    message = `Hola, vi la página de ${brand.name} y quiero información.`,
    phone?: string,
  ) {
    const num = String(phone || whatsappNumber.value).replace(/\D/g, '')
    const text = encodeURIComponent(message)
    return `https://wa.me/${num}?text=${text}`
  }

  function buildEmailHref(options?: { subject?: string; body?: string }) {
    const subject = encodeURIComponent(options?.subject ?? `Consulta ${brand.shortName}`)
    const body = encodeURIComponent(
      options?.body ?? 'Hola, quiero información sobre sus servicios.',
    )
    return `mailto:${email.value}?subject=${subject}&body=${body}`
  }

  const whatsappHref = computed(() => buildWhatsappHref())
  const emailHref = computed(() => buildEmailHref())

  const resolvedContact = computed(() => ({
    ...contact,
    email: email.value,
    whatsapp: whatsappNumber.value,
  }))

  return {
    contact: resolvedContact,
    whatsappHref,
    emailHref,
    buildWhatsappHref,
    buildEmailHref,
  }
}
