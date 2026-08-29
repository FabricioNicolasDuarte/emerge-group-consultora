import type { CampusRoleSlug } from '~/types/campus'
import type { CampusNavEntry } from '~/types/campus-nav'

declare module '#app' {
  interface PageMeta {
    campusRoles?: CampusRoleSlug[]
    campusNav?: CampusNavEntry | CampusNavEntry[]
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    campusRoles?: CampusRoleSlug[]
    campusNav?: CampusNavEntry | CampusNavEntry[]
  }
}

declare module 'nuxt/schema' {
  interface AppConfig {
    contact: {
      email: string
      whatsapp: string
      whatsappMessage: string
    }
    colors: {
      accent: string
      accentHover: string
      action: string
      actionHover: string
      ink: string
      muted: string
      surface: string
      bg: string
    }
    social: {
      linkedin: string
      instagram: string
      facebook: string
      youtube: string
    }
    brand: {
      name: string
      shortName: string
      legalName: string
      logos: {
        favicon: string
        faviconIco: string
        full: string
        fullWhiteBg: string
        fullVertical: string
        mark: string
        markOnDark: string
      }
      icons: Record<string, string>
    }
  }

  interface PublicRuntimeConfig {
    appVersion: string
  }
}

export {}
