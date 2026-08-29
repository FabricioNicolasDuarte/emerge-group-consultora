import type { BrandLogoVariant, CampusIconKey } from '~/types/brand'

export function useAppBrand() {
  const { brand } = useAppConfig()

  function logo(variant: BrandLogoVariant = 'full') {
    return brand.logos[variant]
  }

  function icon(name: CampusIconKey) {
    return brand.icons[name]
  }

  return {
    brand,
    logo,
    icon,
  }
}
