export type VideoEmbed =
  | { kind: 'youtube'; embedUrl: string; videoId: string }
  | { kind: 'vimeo'; embedUrl: string; videoId: string }
  | {
      kind: 'drive'
      embedUrl: string
      openUrl: string
      /** Campus proxy — Drive blocks direct play (Referer + CORP). */
      streamUrl: string
      fileId: string
    }
  | { kind: 'direct'; src: string }
  | { kind: 'none' }

function extractGoogleDriveFileId(value: string): string | null {
  const fileMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/i)
  if (fileMatch?.[1]) return fileMatch[1]

  const openMatch = value.match(/drive\.google\.com\/open\?[^#]*id=([^&]+)/i)
  if (openMatch?.[1]) return decodeURIComponent(openMatch[1])

  const ucMatch = value.match(/drive\.google\.com\/uc\?[^#]*id=([^&]+)/i)
  if (ucMatch?.[1]) return decodeURIComponent(ucMatch[1])

  const docsMatch = value.match(/docs\.google\.com\/(?:file|a\/[^/]+\/file)\/d\/([^/]+)/i)
  if (docsMatch?.[1]) return docsMatch[1]

  return null
}

/** Upstream Drive media URL (server proxy only — do not use in the browser). */
export function googleDriveStreamUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`
}

function extractYoutubeId(value: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i,
    /youtube\.com\/watch\?.*\bv=([\w-]{11})/i,
  ]
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

/** Hint for editors when pasting a lesson video URL. */
export function videoUrlHint(url: string | null | undefined): string | null {
  if (!url?.trim()) {
    return 'Pegá un enlace de YouTube, Vimeo o Google Drive para que el alumno pueda reproducirlo.'
  }
  const parsed = parseVideoUrl(url)
  if (parsed.kind === 'none') {
    return 'No reconocemos ese enlace. Usá YouTube, Vimeo o un link de Google Drive /file/d/…'
  }
  if (parsed.kind === 'drive') {
    return 'Google Drive: el archivo debe estar compartido como “Cualquiera con el enlace”. Si podés, preferí YouTube o Vimeo.'
  }
  return null
}

export function isRecognizedVideoUrl(url: string | null | undefined): boolean {
  const kind = parseVideoUrl(url).kind
  return kind === 'youtube' || kind === 'vimeo' || kind === 'drive' || kind === 'direct'
}

export function parseVideoUrl(url: string | null | undefined): VideoEmbed {
  if (!url?.trim()) return { kind: 'none' }

  const value = url.trim()

  const youtubeId = extractYoutubeId(value)
  if (youtubeId) {
    return {
      kind: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      videoId: youtubeId,
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
      streamUrl: `/api/campus/media/drive/${driveId}`,
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
    return `https://lh3.googleusercontent.com/d/${parsed.fileId}=w640`
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
