export type VideoEmbed =
  | { kind: 'youtube'; embedUrl: string; videoId: string }
  | { kind: 'vimeo'; embedUrl: string; videoId: string }
  | { kind: 'drive'; embedUrl: string; openUrl: string; fileId: string }
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
      videoId: youtubeMatch[1],
    }
  }

  const vimeoMatch = value.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch?.[1]) {
    return {
      kind: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      videoId: vimeoMatch[1],
    }
  }

  const driveId = extractGoogleDriveFileId(value)
  if (driveId) {
    return {
      kind: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      openUrl: `https://drive.google.com/file/d/${driveId}/view`,
      fileId: driveId,
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

/** Thumbnail for cards/previews (YouTube / Drive when available). */
export function videoThumbnailUrl(url: string | null | undefined): string | null {
  const parsed = parseVideoUrl(url)
  if (parsed.kind === 'youtube') {
    return `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`
  }
  if (parsed.kind === 'drive') {
    return `https://drive.google.com/thumbnail?id=${parsed.fileId}&sz=w640`
  }
  if (parsed.kind === 'direct' && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(parsed.src)) {
    return parsed.src
  }
  return null
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
