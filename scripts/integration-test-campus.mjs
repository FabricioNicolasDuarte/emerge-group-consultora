/**
 * Pruebas de integración — buzón + anuncios (flujo completo vía API)
 * Uso: npm run test:integration
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
  } catch { /* noop */ }
}

loadEnv()

const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const anonKey = process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY

const USERS = {
  alumno: {
    email: process.env.TEST_CAMPUS_EMAIL || 'campus.alumno@test.emerge.local',
    password: process.env.TEST_CAMPUS_PASSWORD || 'CampusEmerge2026!',
  },
  docente: {
    email: process.env.TEST_CAMPUS_DOCENTE_EMAIL || 'campus.docente@test.emerge.local',
    password: process.env.TEST_CAMPUS_DOCENTE_PASSWORD || 'CampusEmerge2026!',
  },
  admin: {
    email: process.env.TEST_CAMPUS_STAFF_EMAIL || 'campus.admin@test.emerge.local',
    password: process.env.TEST_CAMPUS_STAFF_PASSWORD || 'CampusEmerge2026!',
  },
}

const results = []
const state = {
  threadId: null,
  announcementId: null,
  alumnoId: null,
}

function pass(name, detail = '') {
  results.push({ ok: true, name, detail })
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ ok: false, name, detail })
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

async function login(email, password) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Login ${email}: ${error.message}`)
  return { client, user: data.user }
}

async function testAuthAll() {
  for (const [role, creds] of Object.entries(USERS)) {
    try {
      const { user } = await login(creds.email, creds.password)
      pass(`Login ${role}`, user.email)
    } catch (e) {
      fail(`Login ${role}`, e.message)
    }
  }
}

async function testMailboxFlow() {
  console.log('\n— Buzón: docente → alumno → respuesta —\n')

  let docente
  let alumno
  try {
    docente = await login(USERS.docente.email, USERS.docente.password)
    alumno = await login(USERS.alumno.email, USERS.alumno.password)
  } catch (e) {
    fail('Buzón: preparación login', e.message)
    return
  }

  const { data: contacts, error: contactsErr } = await docente.client
    .from('mailbox_contacts')
    .select('id, full_name, email, role_slugs')
  if (contactsErr) {
    fail('Docente: listar contactos', contactsErr.message)
    return
  }

  const alumnoContact = contacts?.find((c) => c.email === USERS.alumno.email)
  if (!alumnoContact) {
    fail('Docente: contacto alumno visible', 'no encontrado en mailbox_contacts')
    return
  }
  state.alumnoId = alumnoContact.id
  pass('Docente: contacto alumno visible', alumnoContact.full_name)

  const subject = `[integration] ${Date.now()}`
  const { data: threadId, error: sendErr } = await docente.client.rpc('mailbox_send_message', {
    p_recipient_id: alumnoContact.id,
    p_subject: subject,
    p_body_html: '<p>Mensaje de prueba automática</p>',
    p_body_text: 'Mensaje de prueba automática',
    p_message_type: 'message',
    p_course_id: null,
  })
  if (sendErr) {
    fail('Docente: enviar mensaje', sendErr.message)
    return
  }
  state.threadId = threadId
  pass('Docente: enviar mensaje', `thread=${threadId}`)

  const { data: unreadBefore } = await alumno.client
    .from('my_mailbox_unread')
    .select('unread_count')
    .maybeSingle()
  if ((unreadBefore?.unread_count ?? 0) < 1) {
    fail('Alumno: contador sin leer', `esperado ≥1, obtuvo ${unreadBefore?.unread_count ?? 0}`)
  } else {
    pass('Alumno: contador sin leer', String(unreadBefore.unread_count))
  }

  const { data: threads, error: threadsErr } = await alumno.client
    .from('my_mailbox_threads')
    .select('*')
    .eq('thread_id', threadId)
  if (threadsErr || !threads?.length) {
    fail('Alumno: ver hilo en bandeja', threadsErr?.message || 'hilo no encontrado')
    return
  }
  pass('Alumno: ver hilo en bandeja', threads[0].subject)

  const { data: messages, error: msgErr } = await alumno.client
    .from('mailbox_thread_messages')
    .select('*')
    .eq('thread_id', threadId)
  if (msgErr || !messages?.length) {
    fail('Alumno: leer mensajes del hilo', msgErr?.message || 'sin mensajes')
    return
  }
  pass('Alumno: leer mensajes del hilo', `${messages.length} mensaje(s)`)

  const { error: readErr } = await alumno.client.rpc('mailbox_mark_thread_read', {
    p_thread_id: threadId,
  })
  if (readErr) fail('Alumno: marcar hilo leído', readErr.message)
  else pass('Alumno: marcar hilo leído')

  const { data: replyId, error: replyErr } = await alumno.client.rpc('mailbox_reply', {
    p_thread_id: threadId,
    p_body_html: '<p>Respuesta automática del alumno</p>',
    p_body_text: 'Respuesta automática del alumno',
  })
  if (replyErr) {
    fail('Alumno: responder en hilo', replyErr.message)
    return
  }
  pass('Alumno: responder en hilo', `msg=${replyId}`)

  const { data: afterReply, error: afterErr } = await docente.client
    .from('mailbox_thread_messages')
    .select('id')
    .eq('thread_id', threadId)
  if (afterErr || (afterReply?.length ?? 0) < 2) {
    fail('Docente: ve la respuesta', afterErr?.message || `mensajes=${afterReply?.length ?? 0}`)
  } else {
    pass('Docente: ve la respuesta', `${afterReply.length} mensajes en total`)
  }

  const { error: alumnoSendErr } = await alumno.client.rpc('mailbox_send_message', {
    p_recipient_id: docente.user.id,
    p_subject: 'no debería',
    p_body_html: '<p>x</p>',
    p_body_text: 'x',
    p_message_type: 'message',
    p_course_id: null,
  })
  if (!alumnoSendErr) {
    fail('Alumno: no puede redactar (permiso)', 'RPC no bloqueó')
  } else {
    pass('Alumno: no puede redactar (permiso)', alumnoSendErr.message.slice(0, 60))
  }
}

async function testAnnouncementsFlow() {
  console.log('\n— Anuncios: admin publica → alumno ve —\n')

  let admin
  let docente
  let alumno
  try {
    admin = await login(USERS.admin.email, USERS.admin.password)
    docente = await login(USERS.docente.email, USERS.docente.password)
    alumno = await login(USERS.alumno.email, USERS.alumno.password)
  } catch (e) {
    fail('Anuncios: preparación login', e.message)
    return
  }

  const title = `[integration] Anuncio ${Date.now()}`
  const { data: created, error: createErr } = await admin.client
    .from('announcements')
    .insert({
      title,
      body: 'Cuerpo plano',
      body_html: '<p><strong>Anuncio rich</strong> de prueba</p>',
      excerpt: 'Anuncio rich de prueba',
      background_color: '#fff9f3',
      accent_color: '#0D2C54',
      layout_style: 'card',
      audience: 'all',
      status: 'draft',
      is_pinned: false,
    })
    .select('id')
    .single()

  if (createErr) {
    fail('Admin: crear anuncio borrador', createErr.message)
    return
  }
  state.announcementId = created.id
  pass('Admin: crear anuncio borrador', created.id)

  const { data: docenteDraft, error: docenteCreateErr } = await docente.client
    .from('announcements')
    .insert({
      title: `[integration-docente] ${Date.now()}`,
      body: 'Por docente',
      body_html: '<p>Docente puede crear</p>',
      audience: 'students',
      status: 'draft',
    })
    .select('id')
    .single()

  if (docenteCreateErr) {
    fail('Docente: crear anuncio borrador', docenteCreateErr.message)
  } else {
    pass('Docente: crear anuncio borrador', docenteDraft.id)
    await docente.client.from('announcements').delete().eq('id', docenteDraft.id)
  }

  const { error: pubErr } = await admin.client
    .from('announcements')
    .update({ status: 'published' })
    .eq('id', created.id)
  if (pubErr) {
    fail('Admin: publicar anuncio', pubErr.message)
    return
  }
  pass('Admin: publicar anuncio')

  await new Promise((r) => setTimeout(r, 300))

  const { data: campusRows, error: campusErr } = await alumno.client
    .from('campus_announcements')
    .select('id, title, body_html')
    .eq('id', created.id)
  if (campusErr || !campusRows?.length) {
    fail('Alumno: ve anuncio en campus_announcements', campusErr?.message || 'no encontrado')
  } else {
    pass('Alumno: ve anuncio en campus_announcements', campusRows[0].title)
  }

  const anon = createClient(url, anonKey)
  const { data: publicRows, error: publicErr } = await anon
    .from('public_announcements')
    .select('id, title')
    .eq('id', created.id)
  if (publicErr || !publicRows?.length) {
    fail('Público: ve anuncio en public_announcements', publicErr?.message || 'no encontrado')
  } else {
    pass('Público: ve anuncio en public_announcements', publicRows[0].title)
  }

  const { error: alumnoInsertErr } = await alumno.client
    .from('announcements')
    .insert({ title: 'hack', body: 'x', audience: 'all', status: 'draft' })
  if (!alumnoInsertErr) {
    fail('Alumno: no puede crear anuncios', 'insert permitido')
  } else {
    pass('Alumno: no puede crear anuncios', alumnoInsertErr.message.slice(0, 60))
  }

  const { error: delErr } = await admin.client.from('announcements').delete().eq('id', created.id)
  if (delErr) fail('Admin: cleanup anuncio', delErr.message)
  else pass('Admin: cleanup anuncio')
}

async function testStorageUpload() {
  console.log('\n— Storage: subida imagen anuncio —\n')

  let admin
  try {
    admin = await login(USERS.admin.email, USERS.admin.password)
  } catch (e) {
    fail('Storage: login admin', e.message)
    return
  }

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  const path = `integration-tests/${Date.now()}.png`
  const { error: upErr } = await admin.client.storage
    .from('announcement-media')
    .upload(path, png, { contentType: 'image/png', upsert: false })

  if (upErr) {
    fail('Admin: subir imagen a announcement-media', upErr.message)
    return
  }
  pass('Admin: subir imagen a announcement-media', path)

  const { error: delErr } = await admin.client.storage.from('announcement-media').remove([path])
  if (delErr) fail('Admin: eliminar imagen de prueba', delErr.message)
  else pass('Admin: eliminar imagen de prueba')
}

async function main() {
  console.log('\n══════════════════════════════════════════')
  console.log('  Campus Emerge — pruebas de integración')
  console.log('══════════════════════════════════════════\n')

  if (!url || !anonKey) {
    fail('Entorno', 'Faltan variables Supabase en .env')
    printSummary()
    process.exit(1)
  }

  await testAuthAll()
  await testMailboxFlow()
  await testAnnouncementsFlow()
  await testStorageUpload()

  printSummary()
  process.exit(results.some((r) => !r.ok) ? 1 : 0)
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length
  const bad = results.filter((r) => !r.ok).length
  console.log('\n══════════════════════════════════════════')
  console.log(`  Resumen: ${ok} OK, ${bad} fallos`)
  console.log('══════════════════════════════════════════\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
