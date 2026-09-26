/**
 * Sanitizer SSR-safe sin jsdom / isomorphic-dompurify / sanitize-html
 * (esas libs fallan en Vercel Node por require() de ESM).
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i', 'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'video', 'source',
  'span', 'div', 'iframe', 'hr', 'header', 'footer',
])

const ALLOWED_ATTR = new Set([
  'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style',
  'controls', 'poster', 'width', 'height', 'type', 'allow', 'allowfullscreen',
  'frameborder', 'data-youtube-video',
])

const VOID_TAGS = new Set(['br', 'hr', 'img', 'source'])

function decodeBasicEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function isSafeUrl(value: string) {
  const v = value.trim().toLowerCase()
  if (!v) return false
  if (v.startsWith('javascript:') || v.startsWith('data:text') || v.startsWith('vbscript:')) return false
  return /^(https?:|mailto:|tel:|\/|#)/i.test(value.trim())
}

function filterAttrs(tag: string, rawAttrs: string) {
  const kept: string[] = []
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(rawAttrs)) !== null) {
    const name = m[1].toLowerCase()
    if (name.startsWith('on')) continue
    if (!ALLOWED_ATTR.has(name)) continue
    const value = m[3] ?? m[4] ?? m[5] ?? ''
    if ((name === 'href' || name === 'src') && value && !isSafeUrl(value)) continue
    if (name === 'style' && /expression|url\s*\(\s*['"]?\s*javascript/i.test(value)) continue
    if (value === '') {
      if (name === 'controls' || name === 'allowfullscreen') kept.push(name)
      continue
    }
    const safe = value.replace(/"/g, '&quot;')
    kept.push(`${name}="${safe}"`)
  }
  if (tag === 'a') {
    if (!kept.some((a) => a.startsWith('rel='))) kept.push('rel="noopener noreferrer"')
    if (!kept.some((a) => a.startsWith('target='))) kept.push('target="_blank"')
  }
  return kept.length ? ` ${kept.join(' ')}` : ''
}

export function sanitizeHtml(html: string): string {
  if (!html) return ''
  let out = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (full, rawTag, rawAttrs) => {
    const tag = String(rawTag).toLowerCase()
    const closing = full.startsWith('</')
    if (!ALLOWED_TAGS.has(tag)) return ''
    if (closing) return VOID_TAGS.has(tag) ? '' : `</${tag}>`
    if (VOID_TAGS.has(tag)) return `<${tag}${filterAttrs(tag, rawAttrs || '')}>`
    const selfClosing = /\/>\s*$/.test(full)
    if (selfClosing) return `<${tag}${filterAttrs(tag, rawAttrs || '')}>`
    return `<${tag}${filterAttrs(tag, rawAttrs || '')}>`
  })

  return out
}

export function stripHtml(html: string): string {
  if (!html) return ''
  return decodeBasicEntities(
    html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  ).trim()
}

export function plainTextToHtml(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\n+/)
    .map((line) => `<p>${stripHtml(line).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
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
