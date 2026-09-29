/**
 * Plantilla HTML de correos transaccionales — marca Emerge Group Consultora.
 * Colores alineados con app.config.ts (ink / accent / action).
 */

export const EMAIL_BRAND = {
  name: 'Emerge Group Consultora',
  shortName: 'Emerge Group',
  product: 'Campus Emerge',
  ink: '#0d2c54',
  accent: '#f28c28',
  action: '#2563eb',
  muted: '#66768a',
  bg: '#f6f8fb',
  surface: '#ffffff',
  border: '#e2e8f0',
} as const

export function escapeEmailHtml(value: string) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export type BrandedEmailCta = {
  label: string
  url: string
}

export type BrandedEmailInput = {
  /** Título visible bajo el header de marca */
  title: string
  /** HTML del cuerpo (ya escapado o controlado por el caller) */
  bodyHtml: string
  /** Botón principal opcional */
  cta?: BrandedEmailCta
  /** Nota al pie (texto plano) */
  footerNote?: string
  /** Remitente / firma corta */
  signOff?: string
}

/**
 * Envuelve contenido en layout de marca Emerge Group (compatible con clientes de mail).
 */
export function renderBrandedEmail(input: BrandedEmailInput): string {
  const b = EMAIL_BRAND
  const signOff = escapeEmailHtml(input.signOff || `Equipo ${b.product}`)
  const title = escapeEmailHtml(input.title)
  const footer = escapeEmailHtml(
    input.footerNote
    || `${b.name} · Formación y consultoría. Este correo es automático; no respondas si no se indica.`,
  )

  const ctaBlock = input.cta
    ? `<p style="margin:22px 0 0">
          <a href="${escapeEmailHtml(input.cta.url)}"
             style="display:inline-block;background:${b.action};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;font-size:15px">
            ${escapeEmailHtml(input.cta.label)}
          </a>
        </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${b.bg}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${b.bg};padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${b.surface};border-radius:12px;overflow:hidden;border:1px solid ${b.border}">
          <tr>
            <td style="background:${b.ink};padding:18px 24px">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${b.accent};font-weight:700">
                ${escapeEmailHtml(b.name)}
              </p>
              <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#ffffff;line-height:1.25">
                ${escapeEmailHtml(b.product)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:${b.accent};font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;font-family:Arial,Helvetica,sans-serif;color:${b.ink}">
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;line-height:1.3;color:${b.ink}">
                ${title}
              </h1>
              <div style="margin:0;font-size:15px;line-height:1.55;color:${b.ink}">
                ${input.bodyHtml}
              </div>
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 28px;font-family:Arial,Helvetica,sans-serif">
              <p style="margin:0;font-size:14px;color:${b.muted}">— ${signOff}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:${b.bg};border-top:1px solid ${b.border};font-family:Arial,Helvetica,sans-serif">
              <p style="margin:0;font-size:12px;line-height:1.45;color:${b.muted}">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Asunto con prefijo de marca consistente */
export function brandedSubject(subject: string, product = EMAIL_BRAND.product) {
  const clean = String(subject || '').trim()
  if (!clean) return product
  if (clean.startsWith('[') || clean.includes(product) || clean.includes(EMAIL_BRAND.shortName)) {
    return clean
  }
  return `${product} · ${clean}`
}
