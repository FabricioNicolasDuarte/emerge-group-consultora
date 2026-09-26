import ExcelJS from 'exceljs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const csvPath = resolve('credentials/credenciales-generadas.local.csv')
const csv = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '')
const lines = csv.split(/\r?\n/).filter(Boolean)

function split(line) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"'
        i++
      } else q = !q
    } else if (ch === ',' && !q) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

const rows = lines.map(split)
const header = rows[0]

const wb = new ExcelJS.Workbook()
const ws = wb.addWorksheet('Credenciales')
ws.columns = [
  { header: 'Nombre', key: 'full_name', width: 32 },
  { header: 'Email', key: 'email', width: 36 },
  { header: 'Contraseña temporal', key: 'password', width: 22 },
  { header: 'Estado', key: 'status', width: 12 },
  { header: 'Nota', key: 'note', width: 14 },
]

for (const r of rows.slice(1)) {
  const obj = {}
  header.forEach((h, i) => {
    obj[h] = r[i] ?? ''
  })
  ws.addRow({
    full_name: obj.full_name,
    email: obj.email,
    password: obj.password,
    status: obj.status,
    note: obj.note,
  })
}

ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }

const out1 = resolve('credentials/credenciales-generadas.local.xlsx')
const out2 = 'C:/Users/fabri/OneDrive/Desktop/credenciales-diplomatura.xlsx'
await wb.xlsx.writeFile(out1)
await wb.xlsx.writeFile(out2)
console.log(`OK ${rows.length - 1} filas`)
console.log(out1)
console.log(out2)
