import ExcelJS from 'exceljs'
import type { ApplicationImportRow, ApplicationStatus } from '~/types/applications'
import { normalizeEmail, normalizePhone } from './campus-admin'

const GREEN_RGB = new Set([
  'C5E0B3', 'D9EAD3', 'E2EFD9', 'B6D7A8', 'A8D08D', '93C47D', '6AA84F',
])
const ORANGE_RGB = new Set([
  'F7CAAC', 'F6B26B', 'F4B083', 'FCE5CD', 'E69138', 'FFD966', 'F9CB9C',
])

function argbToRgb(argb?: string | null) {
  if (!argb) return null
  const cleaned = String(argb).replace(/^FF/i, '').toUpperCase()
  if (cleaned.length === 6) return cleaned
  if (cleaned.length === 8) return cleaned.slice(-6)
  return cleaned
}

function classifyFill(fill?: ExcelJS.Fill): Extract<ApplicationStatus, 'ready' | 'pending'> | null {
  if (!fill || fill.type !== 'pattern') return null
  const fg = fill.fgColor
  if (!fg) return null
  const rgb = argbToRgb(fg.argb)
  if (rgb && GREEN_RGB.has(rgb)) return 'ready'
  if (rgb && ORANGE_RGB.has(rgb)) return 'pending'
  // theme greens/oranges are unreliable; ignore
  return null
}

function cellText(value: ExcelJS.CellValue | null | undefined): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text.trim()
  }
  if (typeof value === 'object' && 'richText' in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join('').trim()
  }
  return String(value).trim()
}

function headerKey(label: string) {
  const n = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (n.includes('nombre')) return 'full_name'
  if (n.includes('email') || n.includes('correo')) return 'email'
  if (n.includes('whatsapp') || n.includes('telefono') || n.includes('tel')) return 'phone'
  if (n.includes('equipo') || n.includes('empresa') || n.includes('para vos')) return 'audience'
  if (n.includes('desafio') || n.includes('desafío')) return 'challenge'
  if (n.includes('cual es tu rol') || n.includes('cuál es tu rol') || (n.includes('rol') && !n.includes('email'))) return 'job_role'
  if (n.includes('dedic') || n.includes('ocupacion') || n.includes('ocupación')) return 'occupation'
  if (n.includes('ciudad') || n.includes('provincia')) return 'city'
  return null
}

export async function parseEnrollmentExcel(buffer: Buffer): Promise<ApplicationImportRow[]> {
  const workbook = new ExcelJS.Workbook()
  // Buffer es aceptado por exceljs en runtime (Node).
  await workbook.xlsx.load(buffer as never)
  const sheet = workbook.worksheets[0]
  if (!sheet) {
    throw createError({ statusCode: 400, statusMessage: 'El Excel no tiene hojas' })
  }

  const headerRow = sheet.getRow(1)
  const map = new Map<number, string>()
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const key = headerKey(cellText(cell.value))
    if (key) map.set(col, key)
  })

  if (![...map.values()].includes('full_name') || ![...map.values()].includes('email')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El Excel debe tener columnas de Nombre y Email',
    })
  }

  const rows: ApplicationImportRow[] = []
  const seenEmails = new Set<string>()

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return

    const raw: Record<string, string> = {}
    map.forEach((key, col) => {
      const cell = row.getCell(col)
      if (key === 'phone') {
        raw[key] = normalizePhone(cell.value) ?? ''
      } else {
        raw[key] = cellText(cell.value)
      }
    })

    const fullName = raw.full_name?.trim() ?? ''
    const email = normalizeEmail(raw.email)
    if (!fullName || !email || !email.includes('@')) return

    if (seenEmails.has(email)) return
    seenEmails.add(email)

    const nameCell = row.getCell(1)
    const status = classifyFill(nameCell.fill) ?? classifyFill(row.getCell(2).fill) ?? 'pending'

    rows.push({
      full_name: fullName,
      email,
      phone: raw.phone || null,
      audience: raw.audience || null,
      challenge: raw.challenge || null,
      job_role: raw.job_role || null,
      occupation: raw.occupation || null,
      city: raw.city || null,
      status,
      row_number: rowNumber,
    })
  })

  return rows
}
