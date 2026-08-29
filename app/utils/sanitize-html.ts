import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'video', 'source',
  'span', 'div', 'iframe', 'hr',
]

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style',
  'controls', 'poster', 'width', 'height', 'type', 'allow', 'allowfullscreen',
  'frameborder', 'data-youtube-video',
]

export function sanitizeHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target'],
  })
}

export function stripHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim()
}

export function plainTextToHtml(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\n+/)
    .map((line) => `<p>${DOMPurify.sanitize(line, { ALLOWED_TAGS: [] })}</p>`)
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
