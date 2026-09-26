import sanitize from 'sanitize-html'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'video', 'source',
  'span', 'div', 'iframe', 'hr',
]

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ['href', 'target', 'rel', 'title', 'class'],
  img: ['src', 'alt', 'title', 'class', 'width', 'height'],
  video: ['src', 'controls', 'poster', 'width', 'height', 'class'],
  source: ['src', 'type'],
  iframe: ['src', 'allow', 'allowfullscreen', 'frameborder', 'width', 'height', 'class', 'title'],
  span: ['class', 'style'],
  div: ['class', 'style', 'data-youtube-video'],
  p: ['class'],
  h1: ['class'],
  h2: ['class'],
  h3: ['class'],
  h4: ['class'],
}

const RICH_OPTIONS: sanitize.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTR,
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
}

export function sanitizeHtml(html: string): string {
  if (!html) return ''
  return sanitize(html, RICH_OPTIONS)
}

export function stripHtml(html: string): string {
  if (!html) return ''
  return sanitize(html, { allowedTags: [], allowedAttributes: {} }).trim()
}

export function plainTextToHtml(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\n+/)
    .map((line) => `<p>${stripHtml(line)}</p>`)
    .join('')
}

export function buildMailboxHtml(parts: {
  headerHtml?: string
  bodyHtml?: string
  footerHtml?: string
}) {
  const blocks: string[] = []
  const headerBlock = stripHtml(parts.headerHtml ?? '')
  const bodyBlock = stripHtml(parts.bodyHtml ?? '')
  const footerBlock = stripHtml(parts.footerHtml ?? '')

  if (headerBlock) {
    blocks.push(`<header class="mailbox-custom-header">${sanitizeHtml(parts.headerHtml ?? '')}</header>`)
  }
  if (bodyBlock) {
    blocks.push(sanitizeHtml(parts.bodyHtml ?? ''))
  }
  if (footerBlock) {
    blocks.push(`<footer class="mailbox-custom-footer">${sanitizeHtml(parts.footerHtml ?? '')}</footer>`)
  }
  return blocks.join('')
}
