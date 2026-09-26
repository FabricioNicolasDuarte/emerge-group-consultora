import { chromium } from 'playwright'
import { join } from 'node:path'

const OUT = 'C:/Users/fabri/EmergeGroupConsultora/docs/manual/assets'
const BASE = 'http://127.0.0.1:3000'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
await page.goto(`${BASE}/campus/login`, { waitUntil: 'networkidle' })
await page.fill('#email', 'campus.admin@test.emerge.local')
await page.fill('#password', 'CampusEmerge2026!')
await page.click('button[type=submit]')
await page.waitForTimeout(2500)
await page.goto(`${BASE}/campus/admin/solicitudes`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: join(OUT, '14-admin-solicitudes.png') })
console.log('url', page.url())
const btn = page.getByRole('button', { name: /Importar Excel/i })
console.log('import btn', await btn.count())
if (await btn.count()) {
  await btn.click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT, '14b-admin-importar-excel-modal.png') })
  console.log('modal ok')
}
await browser.close()
