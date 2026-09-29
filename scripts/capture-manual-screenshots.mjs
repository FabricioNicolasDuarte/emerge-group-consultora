/**
 * Captura pantallas para el Manual de Usuario del Campus.
 * Uso: node scripts/capture-manual-screenshots.mjs
 * Requiere: servidor en MANUAL_BASE_URL (default http://127.0.0.1:3000) y usuarios seed.
 *
 * Login público opcional desde prod:
 *   MANUAL_LOGIN_URL=https://www.emergegroupconsultora.com.ar node scripts/capture-manual-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../docs/manual/assets')
const BASE = (process.env.MANUAL_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const LOGIN_BASE = (process.env.MANUAL_LOGIN_URL || BASE).replace(/\/$/, '')

const USERS = {
  admin: { email: 'campus.admin@test.emerge.local', password: 'CampusEmerge2026!' },
  teacher: { email: 'campus.docente@test.emerge.local', password: 'CampusEmerge2026!' },
  student: { email: 'campus.alumno@test.emerge.local', password: 'CampusEmerge2026!' },
}

mkdirSync(OUT, { recursive: true })

async function waitForFenixGone(page) {
  // El Fenix puede quedar visible hasta ~5s después de terminar de cargar
  const loader = page.locator('.fenix-loader')
  try {
    if (await loader.count()) {
      await loader.waitFor({ state: 'hidden', timeout: 12000 })
    }
  } catch {
    // Si quedó pegado, forzamos ocultarlo para no capturar el overlay
    await page.evaluate(() => {
      document.querySelectorAll('.fenix-loader').forEach((el) => el.remove())
    }).catch(() => {})
  }
  await page.waitForTimeout(300)
}

async function shot(page, name, opts = {}) {
  const path = join(OUT, `${name}.png`)
  await waitForFenixGone(page)
  await page.waitForTimeout(opts.wait ?? 600)
  await waitForFenixGone(page)
  await page.screenshot({ path, fullPage: opts.fullPage ?? false })
  console.log('✓', name)
}

async function login(page, user) {
  await page.goto(`${BASE}/campus/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"], input[name="email"], #email', user.email)
  await page.fill('input[type="password"], input[name="password"], #password', user.password)
  await Promise.all([
    page.waitForURL(/\/campus\/(admin|teacher|student|dashboard)/, { timeout: 45000 }),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1400)
}

async function logout(page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.context().clearCookies()
  await page.goto(`${BASE}/campus/login`, { waitUntil: 'networkidle' })
}

async function openHelp(page) {
  const tab = page.locator('.campus-help-notch__tab').first()
  if (await tab.count()) {
    await tab.click()
    await page.waitForTimeout(500)
    return true
  }
  return false
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
  await shot(page, '01-landing-campus', { wait: 1500 })

  await page.goto(`${LOGIN_BASE}/campus/login`, { waitUntil: 'networkidle' })
  await shot(page, '02-login', { wait: 800 })

  await page.goto(`${BASE}/campus/registro`, { waitUntil: 'networkidle' })
  await shot(page, '03-registro', { wait: 600 })

  // —— Admin ——
  await login(page, USERS.admin)
  await page.goto(`${BASE}/campus/admin`, { waitUntil: 'networkidle' })
  await shot(page, '10-admin-inicio', { wait: 1400 })

  if (await openHelp(page)) {
    await shot(page, '50-ayuda-contextual', { wait: 400 })
    await page.keyboard.press('Escape')
    const closeHelp = page.locator('.campus-help-notch__tab').first()
    if (await closeHelp.count()) await closeHelp.click().catch(() => {})
  }

  await page.goto(`${BASE}/campus/admin/cursos`, { waitUntil: 'networkidle' })
  await shot(page, '11-admin-cursos', { wait: 1000 })

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

  // Contenido / asistencia / notas
  await page.goto(`${BASE}/campus/admin/cursos`, { waitUntil: 'networkidle' })
  const contenidoLink = page.locator('a[href*="/contenido"]').first()
  if (await contenidoLink.count()) {
    const href = await contenidoLink.getAttribute('href')
    if (href) {
      const path = href.startsWith('http') ? new URL(href).pathname : href
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
      await shot(page, '20-admin-curso-contenido', { wait: 1000 })

      const baseCourse = path.replace(/\/contenido.*/, '')
      await page.goto(`${BASE}${baseCourse}/asistencia`, { waitUntil: 'networkidle' })
      await shot(page, '21-admin-curso-asistencia', { wait: 1100 })

      // Preferí un curso con alumnos (botón habilitado); si no, buscá otro enlace Asistencia
      let nuevoReg = page.getByRole('button', { name: /Nuevo registro/i }).first()
      if (!(await nuevoReg.count()) || !(await nuevoReg.isEnabled())) {
        await page.goto(`${BASE}/campus/admin/cursos`, { waitUntil: 'networkidle' })
        const asisHrefs = await page.locator('a[href*="/asistencia"]').evaluateAll((els) =>
          els.map((el) => el.getAttribute('href')).filter(Boolean),
        )
        for (const h of asisHrefs) {
          const p = h.startsWith('http') ? new URL(h).pathname : h
          await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' })
          await page.waitForTimeout(800)
          nuevoReg = page.getByRole('button', { name: /Nuevo registro/i }).first()
          if ((await nuevoReg.count()) && (await nuevoReg.isEnabled())) {
            await shot(page, '21-admin-curso-asistencia', { wait: 400 })
            break
          }
        }
      }

      nuevoReg = page.getByRole('button', { name: /Nuevo registro/i }).first()
      if ((await nuevoReg.count()) && (await nuevoReg.isEnabled())) {
        await nuevoReg.click()
        await page.waitForTimeout(600)
        await shot(page, '21b-admin-asistencia-nuevo-registro', { wait: 400 })
      } else {
        console.warn('⚠ 21b omitido: ningún curso con alumnos para registrar asistencia')
      }

      const porAlumno = page.getByRole('button', { name: /Por alumno/i }).first()
      if (await porAlumno.count()) {
        await porAlumno.click()
        await page.waitForTimeout(700)
        await shot(page, '21c-admin-asistencia-por-alumno', { wait: 500 })
      }

      const califLink = page.locator('a[href*="/calificaciones"]').first()
      if (await califLink.count()) {
        const califHref = await califLink.getAttribute('href')
        if (califHref) {
          const cp = califHref.startsWith('http') ? new URL(califHref).pathname : califHref
          await page.goto(`${BASE}${cp}`, { waitUntil: 'networkidle' })
          await shot(page, '22-admin-curso-calificaciones', { wait: 900 })
        }
      } else {
        await page.goto(`${BASE}${baseCourse}/calificaciones`, { waitUntil: 'networkidle' })
        await shot(page, '22-admin-curso-calificaciones', { wait: 900 })
      }
    }
  }

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
  await shot(page, '30-teacher-inicio', { wait: 1400 })

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
  await shot(page, '40-student-inicio', { wait: 1400 })

  await page.goto(`${BASE}/campus/student/cursos`, { waitUntil: 'networkidle' })
  await shot(page, '41-student-cursos', { wait: 900 })

  await page.goto(`${BASE}/campus/student/asistencia`, { waitUntil: 'networkidle' })
  await shot(page, '42-student-asistencia', { wait: 1100 })

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
