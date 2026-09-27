export type VideoEmbed =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'vimeo'; embedUrl: string }
  | { kind: 'drive'; embedUrl: string; openUrl: string }
  | { kind: 'direct'; src: string }
  | { kind: 'none' }

function extractGoogleDriveFileId(value: string): string | null {
  const fileMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/i)
  if (fileMatch?.[1]) return fileMatch[1]

  const openMatch = value.match(/drive\.google\.com\/open\?[^#]*id=([^&]+)/i)
  if (openMatch?.[1]) return decodeURIComponent(openMatch[1])

  const ucMatch = value.match(/drive\.google\.com\/uc\?[^#]*id=([^&]+)/i)
  if (ucMatch?.[1]) return decodeURIComponent(ucMatch[1])

  return null
}

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

  const driveId = extractGoogleDriveFileId(value)
  if (driveId) {
    return {
      kind: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      openUrl: `https://drive.google.com/file/d/${driveId}/view`,
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
