/**
 * Smoke tests — buzón + anuncios (post migraciones Fase 7)
 * Uso: node scripts/smoke-test-comms.mjs
 *
 * Opcional en .env para pruebas autenticadas:
 *   TEST_CAMPUS_EMAIL=...
 *   TEST_CAMPUS_PASSWORD=...
 *   TEST_CAMPUS_STAFF_EMAIL=...   (admin/docente)
 *   TEST_CAMPUS_STAFF_PASSWORD=...
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  try {
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env opcional si las vars ya están en el entorno
  }
}

loadEnv()

const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const anonKey = process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY

const results = []

function pass(name, detail = '') {
  results.push({ ok: true, name, detail })
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ ok: false, name, detail })
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

async function testAnonSchema(supabase) {
  const { error: pubErr } = await supabase.from('public_announcements').select('id').limit(1)
  if (pubErr) fail('Vista public_announcements (anon)', pubErr.message)
  else pass('Vista public_announcements (anon)')

  const { error: bucketErr } = await supabase.storage.from('announcement-media').list('', { limit: 1 })
  if (bucketErr) fail('Bucket announcement-media', bucketErr.message)
  else pass('Bucket announcement-media accesible')
}

async function testAuthenticatedViews(supabase, label) {
  const checks = [
    ['my_mailbox_threads', 'Vista my_mailbox_threads'],
    ['my_mailbox_unread', 'Vista my_mailbox_unread'],
    ['mailbox_contacts', 'Vista mailbox_contacts'],
    ['campus_announcements', 'Vista campus_announcements'],
    ['admin_announcements', 'Vista admin_announcements'],
  ]

  for (const [table, name] of checks) {
    const { error } = await supabase.from(table).select('*').limit(1)
    if (error) fail(`${name} (${label})`, error.message)
    else pass(`${name} (${label})`)
  }
}

async function testRpcSendGuard(supabase, label) {
  const { error } = await supabase.rpc('mailbox_send_message', {
    p_recipient_id: '00000000-0000-0000-0000-000000000001',
    p_subject: 'test',
    p_body_html: '<p>test</p>',
    p_body_text: 'test',
    p_message_type: 'message',
    p_course_id: null,
  })
  if (!error) {
    fail(`RPC mailbox_send_message bloquea inválido (${label})`, 'no devolvió error')
    return
  }
  pass(`RPC mailbox_send_message existe (${label})`, error.message.slice(0, 80))
}

async function signIn(email, password) {
  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { supabase: null, error }
  return { supabase, user: data.user, error: null }
}

async function testStaffAnnouncementWrite(supabase, label) {
  const title = `[smoke] ${Date.now()}`
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body: 'Prueba automática',
      body_html: '<p>Prueba automática</p>',
      excerpt: 'Prueba',
      audience: 'all',
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) {
    fail(`Insert anuncio borrador (${label})`, error.message)
    return
  }

  pass(`Insert anuncio borrador (${label})`, `id=${data.id}`)

  const { error: delErr } = await supabase.from('announcements').delete().eq('id', data.id)
  if (delErr) fail(`Cleanup anuncio (${label})`, delErr.message)
  else pass(`Cleanup anuncio (${label})`)
}

async function main() {
  console.log('\nCampus Emerge — smoke test comunicaciones\n')

  if (!url || !anonKey) {
    fail('Variables de entorno', 'Faltan NUXT_PUBLIC_SUPABASE_URL y NUXT_PUBLIC_SUPABASE_KEY en .env')
    printSummary()
    process.exit(1)
  }

  const anon = createClient(url, anonKey)
  await testAnonSchema(anon)

  const studentEmail = process.env.TEST_CAMPUS_EMAIL
  const studentPassword = process.env.TEST_CAMPUS_PASSWORD
  const staffEmail = process.env.TEST_CAMPUS_STAFF_EMAIL
  const staffPassword = process.env.TEST_CAMPUS_STAFF_PASSWORD

  if (studentEmail && studentPassword) {
    const { supabase, error } = await signIn(studentEmail, studentPassword)
    if (error) fail('Login alumno', error.message)
    else {
      pass('Login alumno', studentEmail)
      await testAuthenticatedViews(supabase, 'alumno')
      await testRpcSendGuard(supabase, 'alumno')
    }
  } else {
    console.log('○ Sin TEST_CAMPUS_EMAIL / TEST_CAMPUS_PASSWORD — omitiendo pruebas alumno')
  }

  if (staffEmail && staffPassword) {
    const { supabase, error } = await signIn(staffEmail, staffPassword)
    if (error) fail('Login staff', error.message)
    else {
      pass('Login staff', staffEmail)
      await testAuthenticatedViews(supabase, 'staff')
      await testRpcSendGuard(supabase, 'staff')
      await testStaffAnnouncementWrite(supabase, 'staff')
    }
  } else if (studentEmail && studentPassword && !staffEmail) {
    console.log('○ Sin TEST_CAMPUS_STAFF_* — omitiendo pruebas staff/docente')
  }

  if (!studentEmail && !staffEmail) {
    console.log('\nPara pruebas completas agregá al .env:')
    console.log('  TEST_CAMPUS_EMAIL=alumno@...')
    console.log('  TEST_CAMPUS_PASSWORD=...')
    console.log('  TEST_CAMPUS_STAFF_EMAIL=admin@...')
    console.log('  TEST_CAMPUS_STAFF_PASSWORD=...')
  }

  printSummary()
  process.exit(results.some((r) => !r.ok) ? 1 : 0)
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length
  const bad = results.filter((r) => !r.ok).length
  console.log(`\nResumen: ${ok} OK, ${bad} fallos\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
