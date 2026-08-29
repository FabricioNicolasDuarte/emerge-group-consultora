import { SITE_CONTACT } from '~/data/site-content'

export type SiteContactChannel = (typeof SITE_CONTACT)[number] & { href: string }

export function useSiteContactChannels() {
  const { brand } = useAppConfig()
  const { buildWhatsappHref, emailHref } = useAppContact()

  function channelHref(channel: (typeof SITE_CONTACT)[number]) {
    if (channel.type === 'email') return emailHref.value
    if (channel.type === 'whatsapp') {
      const topic = channel.whatsappTopic ?? channel.label.toLowerCase()
      const message = `Hola, vi la página de ${brand.name} y quiero información sobre ${topic}.`
      const phone = 'whatsapp' in channel && channel.whatsapp ? channel.whatsapp : undefined
      return buildWhatsappHref(message, phone)
    }
    return ''
  }

  const channels = computed<SiteContactChannel[]>(() =>
    SITE_CONTACT.map((channel) => ({
      ...channel,
      href: channelHref(channel),
    })),
  )

  const switchOptions = computed(() =>
    channels.value.map((ch) => ({ id: ch.id, label: ch.label })),
  )

  return { channels, switchOptions, channelHref }
}
