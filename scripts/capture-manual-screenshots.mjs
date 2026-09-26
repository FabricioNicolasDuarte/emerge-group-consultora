/**
 * Captura pantallas para el Manual de Usuario del Campus.
 * Uso: node scripts/capture-manual-screenshots.mjs
 * Requiere: servidor en http://127.0.0.1:3000 y usuarios seed.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../docs/manual/assets')
const BASE = process.env.MANUAL_BASE_URL || 'http://127.0.0.1:3000'

const USERS = {
  admin: { email: 'campus.admin@test.emerge.local', password: 'CampusEmerge2026!' },
  teacher: { email: 'campus.docente@test.emerge.local', password: 'CampusEmerge2026!' },
  student: { email: 'campus.alumno@test.emerge.local', password: 'CampusEmerge2026!' },
}

mkdirSync(OUT, { recursive: true })

async function shot(page, name, opts = {}) {
  const path = join(OUT, `${name}.png`)
  await page.waitForTimeout(opts.wait ?? 800)
  await page.screenshot({ path, fullPage: opts.fullPage ?? false })
  console.log('✓', name)
}

async function login(page, user) {
  await page.goto(`${BASE}/campus/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"], input[name="email"], #email', user.email)
  await page.fill('input[type="password"], input[name="password"], #password', user.password)
  await Promise.all([
    page.waitForURL(/\/campus\/(admin|teacher|student|dashboard)/, { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1200)
}

async function logout(page) {
  // Limpia sesión vía storage + goto login
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  const cookies = await page.context().cookies()
  await page.context().clearCookies()
  void cookies
  await page.goto(`${BASE}/campus/login`, { waitUntil: 'networkidle' })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  // —— Público ——
  await page.goto(`${BASE}/campus`, { waitUntil: 'networkidle' })
  await shot(page, '01-landing-campus', { fullPage: false, wait: 1500 })

  await page.goto(`${BASE}/campus/login`, { waitUntil: 'networkidle' })
  await shot(page, '02-login', { wait: 600 })

  await page.goto(`${BASE}/campus/registro`, { waitUntil: 'networkidle' })
  await shot(page, '03-registro', { wait: 600 })

  // —— Admin ——
  await login(page, USERS.admin)
  await page.goto(`${BASE}/campus/admin`, { waitUntil: 'networkidle' })
  await shot(page, '10-admin-inicio', { wait: 1200 })

  await page.goto(`${BASE}/campus/admin/cursos`, { waitUntil: 'networkidle' })
  await shot(page, '11-admin-cursos', { wait: 1000 })

  // Abrir modal nuevo curso si existe botón
  const newCourseBtn = page.getByRole('button', { name: /Nuevo curso|\+ Nuevo curso/i }).first()
  if (await newCourseBtn.count()) {
    await newCourseBtn.click()
    await page.waitForTimeout(500)
    await shot(page, '11b-admin-nuevo-curso-modal', { wait: 400 })
    await page.keyboard.press('Escape')
  }

  await page.goto(`${BASE}/campus/admin/alumnos`, { waitUntil: 'networkidle' })
  await shot(page, '12-admin-alumnos', { wait: 1000 })

  const newStudentBtn = page.getByRole('button', { name: /Nuevo alumno/i }).first()
  if (await newStudentBtn.count()) {
    await newStudentBtn.click()
    await page.waitForTimeout(500)
    await shot(page, '12b-admin-nuevo-alumno-modal', { wait: 400 })
    await page.keyboard.press('Escape')
  }

  await page.goto(`${BASE}/campus/admin/inscripciones`, { waitUntil: 'networkidle' })
  await shot(page, '13-admin-inscripciones', { wait: 900 })

  await page.goto(`${BASE}/campus/admin/solicitudes`, { waitUntil: 'networkidle' })
  await shot(page, '14-admin-solicitudes', { wait: 1000 })

  const importBtn = page.getByRole('button', { name: /Importar Excel/i }).first()
  if (await importBtn.count()) {
    await importBtn.click()
    await page.waitForTimeout(500)
    await shot(page, '14b-admin-importar-excel-modal', { wait: 400 })
    await page.keyboard.press('Escape')
  }

  await page.goto(`${BASE}/campus/admin/certificados`, { waitUntil: 'networkidle' })
  await shot(page, '15-admin-certificados', { wait: 900 })

  await page.goto(`${BASE}/campus/admin/reportes`, { waitUntil: 'networkidle' })
  await shot(page, '16-admin-reportes', { wait: 1000 })

  await page.goto(`${BASE}/campus/admin/comunicaciones`, { waitUntil: 'networkidle' })
  await shot(page, '17-admin-comunicaciones', { wait: 1000 })

  await page.goto(`${BASE}/campus/admin/auditoria`, { waitUntil: 'networkidle' })
  await shot(page, '18-admin-auditoria', { wait: 900 })

  await page.goto(`${BASE}/campus/buzon`, { waitUntil: 'networkidle' })
  await shot(page, '19-buzon', { wait: 900 })

  // Contenido / asistencia / notas del primer curso si hay links
  await page.goto(`${BASE}/campus/admin/cursos`, { waitUntil: 'networkidle' })
  const contenidoLink = page.locator('a[href*="/contenido"]').first()
  if (await contenidoLink.count()) {
    const href = await contenidoLink.getAttribute('href')
    if (href) {
      await page.goto(`${BASE}${href.startsWith('http') ? new URL(href).pathname : href}`, { waitUntil: 'networkidle' })
      await shot(page, '20-admin-curso-contenido', { wait: 1000 })
      const baseCourse = href.replace(/\/contenido.*/, '')
      await page.goto(`${BASE}${baseCourse}/asistencia`, { waitUntil: 'networkidle' })
      await shot(page, '21-admin-curso-asistencia', { wait: 900 })
      await page.goto(`${BASE}${baseCourse}/calificaciones`, { waitUntil: 'networkidle' })
      await shot(page, '22-admin-curso-calificaciones', { wait: 900 })
    }
  }

  // Curso público (catálogo)
  const courseCard = page.locator('a[href*="/campus/cursos/"]').first()
  await page.goto(`${BASE}/campus`, { waitUntil: 'networkidle' })
  const pubCourse = page.locator('a[href*="/campus/cursos/"]').first()
  if (await pubCourse.count()) {
    await pubCourse.click()
    await page.waitForLoadState('networkidle')
    await shot(page, '04-curso-publico', { wait: 1000 })
  }

  await logout(page)

  // —— Docente ——
  await login(page, USERS.teacher)
  await page.goto(`${BASE}/campus/teacher`, { waitUntil: 'networkidle' })
  await shot(page, '30-teacher-inicio', { wait: 1200 })

  await page.goto(`${BASE}/campus/teacher/cursos`, { waitUntil: 'networkidle' })
  await shot(page, '31-teacher-cursos', { wait: 1000 })

  await page.goto(`${BASE}/campus/teacher/comunicaciones`, { waitUntil: 'networkidle' })
  await shot(page, '32-teacher-comunicaciones', { wait: 900 })

  await page.goto(`${BASE}/campus/teacher/anuncios`, { waitUntil: 'networkidle' })
  await shot(page, '33-teacher-anuncios', { wait: 900 })

  await logout(page)

  // —— Alumno ——
  await login(page, USERS.student)
  await page.goto(`${BASE}/campus/student`, { waitUntil: 'networkidle' })
  await shot(page, '40-student-inicio', { wait: 1200 })

  await page.goto(`${BASE}/campus/student/cursos`, { waitUntil: 'networkidle' })
  await shot(page, '41-student-cursos', { wait: 900 })

  await page.goto(`${BASE}/campus/student/asistencia`, { waitUntil: 'networkidle' })
  await shot(page, '42-student-asistencia', { wait: 900 })

  await page.goto(`${BASE}/campus/student/notas`, { waitUntil: 'networkidle' })
  await shot(page, '43-student-notas', { wait: 900 })

  await page.goto(`${BASE}/campus/student/comunicaciones`, { waitUntil: 'networkidle' })
  await shot(page, '44-student-comunicaciones', { wait: 900 })

  await page.goto(`${BASE}/campus/student/progreso`, { waitUntil: 'networkidle' })
  await shot(page, '45-student-progreso', { wait: 900 })

  await page.goto(`${BASE}/campus/student/certificados`, { waitUntil: 'networkidle' })
  await shot(page, '46-student-certificados', { wait: 900 })

  await browser.close()
  console.log('\nListo. Capturas en docs/manual/assets/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
