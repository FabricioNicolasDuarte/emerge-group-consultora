type PublicSeoOptions = {
  title: string
  description: string
  ogImage?: string
  noindex?: boolean
}

export function usePublicSeo(options: MaybeRefOrGetter<PublicSeoOptions>) {
  const route = useRoute()
  const { brand } = useAppConfig()
  const { public: { appUrl } } = useRuntimeConfig()

  const resolved = computed(() => toValue(options))

  const canonicalUrl = computed(() => {
    const base = String(appUrl || '').replace(/\/$/, '')
    return `${base}${route.path}`
  })

  const defaultOgImage = computed(() => {
    const base = String(appUrl || '').replace(/\/$/, '')
    return `${base}${brand.logos.full}`
  })

  useHead({
    link: () => [
      { rel: 'canonical', href: canonicalUrl.value },
    ],
  })

  useSeoMeta({
    title: () => resolved.value.title,
    description: () => resolved.value.description,
    ogTitle: () => resolved.value.title,
    ogDescription: () => resolved.value.description,
    ogType: 'website',
    ogSiteName: brand.name,
    ogUrl: () => canonicalUrl.value,
    twitterCard: 'summary_large_image',
    robots: () => (resolved.value.noindex ? 'noindex, nofollow' : 'index, follow'),
    ogImage: () => resolved.value.ogImage ?? defaultOgImage.value,
  })
}
