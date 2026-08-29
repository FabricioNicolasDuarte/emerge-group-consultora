export type SocialNetwork = 'linkedin' | 'instagram' | 'facebook' | 'youtube'

export type SocialLink = {
  id: SocialNetwork
  label: string
  href: string
}

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
}

export function useAppSocial() {
  const { social } = useAppConfig()

  const links = computed<SocialLink[]>(() =>
    (Object.keys(SOCIAL_LABELS) as SocialNetwork[])
      .map((id) => ({
        id,
        label: SOCIAL_LABELS[id],
        href: social[id]?.trim() ?? '',
      }))
      .filter((item) => item.href.length > 0),
  )

  const hasLinks = computed(() => links.value.length > 0)

  return { links, hasLinks }
}
