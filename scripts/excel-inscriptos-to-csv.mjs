/**
 * Convierte INSCRIPTOS DIPLOMATURA.xlsx → credentials/alumnos.local.csv
 * Solo filas VERDES (listos). Naranja → alumnos-pendientes.local.csv
 */
import ExcelJS from 'exceljs'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC = process.argv[2] || 'C:/Users/fabri/OneDrive/Desktop/INSCRIPTOS DIPLOMATURA.xlsx'

const GREEN = new Set(['C5E0B3', 'D9EAD3', 'E2EFD9', 'B6D7A8', 'A8D08D', '93C47D', '6AA84F'])
const ORANGE = new Set(['F7CAAC', 'F6B26B', 'F4B083', 'FCE5CD', 'E69138', 'FFD966', 'F9CB9C'])

function rgb(argb) {
  if (!argb) return null
  const c = String(argb).replace(/^FF/i, '').toUpperCase()
  return c.length === 8 ? c.slice(-6) : c
}

function statusFromFill(fill) {
  if (!fill || fill.type !== 'pattern' || !fill.fgColor) return null
  const r = rgb(fill.fgColor.argb)
  if (r && GREEN.has(r)) return 'ready'
  if (r && ORANGE.has(r)) return 'pending'
  return null
}

function text(v) {
  if (v == null) return ''
  if (typeof v === 'object' && v.text) return String(v.text).trim()
  if (typeof v === 'object' && Array.isArray(v.richText)) {
    return v.richText.map((p) => p.text).join('').trim()
  }
  return String(v).trim()
}

function esc(s) {
  const t = String(s ?? '')
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

const wb = new ExcelJS.Workbook()
await wb.xlsx.readFile(SRC)
const ws = wb.worksheets[0]
const ready = []
const pending = []

ws.eachRow({ includeEmpty: false }, (row, n) => {
  if (n === 1) return
  const full_name = text(row.getCell(1).value)
  const email = text(row.getCell(2).value).toLowerCase()
  if (!full_name || !email.includes('@')) return
  const st = statusFromFill(row.getCell(1).fill) || statusFromFill(row.getCell(2).fill) || 'pending'
  const rec = {
    full_name,
    email,
    password: '',
    phone: text(row.getCell(3).value),
    audience: text(row.getCell(4).value),
    challenge: text(row.getCell(5).value).replace(/\r?\n/g, ' '),
    job_role: text(row.getCell(6).value),
    occupation: text(row.getCell(7).value),
    city: text(row.getCell(8).value),
    status: st,
  }
  ;(st === 'ready' ? ready : pending).push(rec)
})

const header = 'full_name,email,password,phone,city,job_role,occupation,audience,challenge'
const body = ready.map((r) =>
  [r.full_name, r.email, r.password, r.phone, r.city, r.job_role, r.occupation, r.audience, r.challenge]
    .map(esc)
    .join(','),
)
writeFileSync(resolve(ROOT, 'credentials/alumnos.local.csv'), [header, ...body].join('\n'), 'utf8')
writeFileSync(
  resolve(ROOT, 'credentials/alumnos-pendientes.local.csv'),
  ['full_name,email,status', ...pending.map((p) => [p.full_name, p.email, p.status].map(esc).join(','))].join('\n'),
  'utf8',
)

console.log(`Listos (verde): ${ready.length}`)
console.log(`Pendientes (naranja): ${pending.length}`)
pending.forEach((p) => console.log(`  · ${p.full_name} <${p.email}>`))
