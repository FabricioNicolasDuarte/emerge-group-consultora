/**
 * Genera Excel con staff + alumnos (credenciales-generadas.local.xlsx
 * y copia en Escritorio).
 */
import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnvFile } from './pg-connect.mjs'
import { randomBytes } from 'node:crypto'

loadEnvFile()

const ROOT = resolve(process.cwd())
const CSV = resolve(ROOT, 'credentials/credenciales-generadas.local.csv')
const OUT = resolve(ROOT, 'credentials/credenciales-generadas.local.xlsx')
const DESKTOP = 'C:/Users/fabri/OneDrive/Desktop/credenciales-diplomatura.xlsx'

const STAFF_PASSWORD = 'CampusEmerge2026!'

const STAFF = [
  {
    rol: 'Superadmin',
    full_name: 'Marina López (prueba)',
    email: 'campus.admin@test.emerge.local',
    password: STAFF_PASSWORD,
    panel: '/campus/admin',
    note: 'Usuario de prueba — panel admin',
  },
  {
    rol: 'Docente',
    full_name: 'Diego Fernández (prueba)',
    email: 'campus.docente@test.emerge.local',
    password: STAFF_PASSWORD,
    panel: '/campus/teacher',
    note: 'Usuario de prueba — panel docente',
  },
  {
    rol: 'Alumno (prueba)',
    full_name: 'Lucía Benítez (prueba)',
    email: 'campus.alumno@test.emerge.local',
    password: STAFF_PASSWORD,
    panel: '/campus/student',
    note: 'Usuario de prueba — panel alumno',
  },
]

function splitCsv(line) {
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

function genTemp() {
  return `Eg${randomBytes(4).toString('hex')}!${randomBytes(2).toString('hex')}`
}

async function ensureStaffPasswords(admin) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const users = list?.users || []

  for (const s of STAFF) {
    const u = users.find((x) => x.email?.toLowerCase() === s.email.toLowerCase())
    if (!u) {
      s.note = 'NO EXISTE — correr npm run seed:test-users'
      s.password = ''
      continue
    }
    await admin.auth.admin.updateUserById(u.id, {
      password: s.password,
      email_confirm: true,
    })
  }

  // Superadmin real (correo de la org): regenerar temporal si existe
  const real = users.find((x) => x.email?.toLowerCase() === 'emergegroup.fsa@gmail.com')
  let realRow = null
  if (real) {
    const pass = genTemp()
    await admin.auth.admin.updateUserById(real.id, {
      password: pass,
      email_confirm: true,
    })
    realRow = {
      rol: 'Superadmin (org)',
      full_name: 'Emerge Group',
      email: 'emergegroup.fsa@gmail.com',
      password: pass,
      panel: '/campus/admin',
      note: 'Cuenta real de la organización — contraseña temporal regenerada',
    }
  }
  return realRow
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2C54' } }
}

async function main() {
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Falta SUPABASE en .env')

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Asegurando contraseñas de staff…')
  const realAdmin = await ensureStaffPasswords(admin)

  const alumnos = []
  if (existsSync(CSV)) {
    const lines = readFileSync(CSV, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
    const header = splitCsv(lines[0])
    for (const line of lines.slice(1)) {
      const cells = splitCsv(line)
      const obj = {}
      header.forEach((h, i) => {
        obj[h] = cells[i] ?? ''
      })
      alumnos.push(obj)
    }
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Campus Emerge'

  const staffSheet = wb.addWorksheet('Staff y prueba')
  staffSheet.columns = [
    { header: 'Rol', key: 'rol', width: 18 },
    { header: 'Nombre', key: 'full_name', width: 28 },
    { header: 'Email', key: 'email', width: 38 },
    { header: 'Contraseña', key: 'password', width: 22 },
    { header: 'Panel', key: 'panel', width: 18 },
    { header: 'Nota', key: 'note', width: 48 },
  ]
  styleHeader(staffSheet.getRow(1))
  const staffRows = realAdmin ? [realAdmin, ...STAFF] : [...STAFF]
  for (const s of staffRows) staffSheet.addRow(s)

  const info = wb.addWorksheet('Acceso')
  info.columns = [{ header: 'Campo', key: 'k', width: 22 }, { header: 'Valor', key: 'v', width: 70 }]
  styleHeader(info.getRow(1))
  info.addRow({ k: 'Login producción', v: 'https://emerge-group-consultora.vercel.app/campus/login' })
  info.addRow({ k: 'Login local', v: 'http://localhost:3000/campus/login' })
  info.addRow({ k: 'Curso', v: 'Diplomatura en Gestión y Liderazgo' })
  info.addRow({ k: 'Alumnos verdes', v: String(alumnos.length) })
  info.addRow({ k: 'Pendientes naranja', v: 'No dados de alta (Ailen, Montenegro, Pérez, Moyano)' })

  const alumSheet = wb.addWorksheet('Alumnos')
  alumSheet.columns = [
    { header: 'Rol', key: 'rol', width: 10 },
    { header: 'Nombre', key: 'full_name', width: 32 },
    { header: 'Email', key: 'email', width: 36 },
    { header: 'Contraseña temporal', key: 'password', width: 22 },
    { header: 'Estado', key: 'status', width: 12 },
    { header: 'Nota', key: 'note', width: 14 },
  ]
  styleHeader(alumSheet.getRow(1))
  for (const a of alumnos) {
    alumSheet.addRow({
      rol: 'Alumno',
      full_name: a.full_name,
      email: a.email,
      password: a.password,
      status: a.status,
      note: a.note,
    })
  }

  await wb.xlsx.writeFile(OUT)
  await wb.xlsx.writeFile(DESKTOP)
  console.log(`✓ ${OUT}`)
  console.log(`✓ ${DESKTOP}`)
  console.log(`Staff: ${staffRows.length} | Alumnos: ${alumnos.length}`)
  if (realAdmin) console.log(`Superadmin org: ${realAdmin.email} / ${realAdmin.password}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
