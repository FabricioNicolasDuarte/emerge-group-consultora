export type HomePulseItem = {
  id: string
  label: string
  to?: string
  icon?: string
  tone?: 'default' | 'alert' | 'muted'
  external?: boolean
}

export type HomeToolkitItem = {
  id: string
  label: string
  hint: string
  to: string
  icon: string
  badge?: string | number
}

export type HomeQueueItem = {
  id: string
  title: string
  subtitle?: string
  to: string
  tone?: 'default' | 'info' | 'muted'
}
