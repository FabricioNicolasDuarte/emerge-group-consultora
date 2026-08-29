export type VideoEmbed =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'vimeo'; embedUrl: string }
  | { kind: 'direct'; src: string }
  | { kind: 'none' }

export function parseVideoUrl(url: string | null | undefined): VideoEmbed {
  if (!url?.trim()) return { kind: 'none' }

  const value = url.trim()

  const youtubeMatch = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  )
  if (youtubeMatch?.[1]) {
    return {
      kind: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    }
  }

  const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch?.[1]) {
    return {
      kind: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    }
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(value) || value.startsWith('blob:')) {
    return { kind: 'direct', src: value }
  }

  if (value.startsWith('http')) {
    return { kind: 'direct', src: value }
  }

  return { kind: 'none' }
}

export function lessonTypeLabel(type: string) {
  if (type === 'video') return 'Video'
  if (type === 'activity') return 'Actividad'
  if (type === 'document') return 'Documento'
  if (type === 'reading') return 'Lectura'
  return 'Clase'
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return ''
  return `${minutes} min`
}
