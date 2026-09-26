# Deploy — Emerge Group Consultora

Guía de publicación **solo para este repositorio** (`emergegroup-consultora`).

**Stack:** Nuxt 4 + Nitro + Supabase (Auth, Postgres, Storage).  
**No aplica:** Django, ECOM, Superset ni otros proyectos del workspace de Cursor.

Sitio institucional (`/`) + campus virtual (`/campus/*`) en una sola app Node.

---

## Antes del primer deploy

1. Supabase configurado → `docs/SETUP-SUPABASE.md`
2. Migraciones aplicadas → `npm run db:migrate` o SQL en orden (`docs/MIGRACIONES.md`)
3. Usuario admin con rol `superadmin` (no uses seeds de prueba en producción)
4. Marca y contacto → `app/app.config.ts` y/o variables `NUXT_PUBLIC_CONTACT_*`

---

## Variables de entorno en el hosting

### Obligatorias

```env
NUXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=eyJ...anon_public
NUXT_PUBLIC_APP_URL=https://tu-dominio.com
```

`NUXT_PUBLIC_APP_URL` se usa en canonical, Open Graph, retorno de pagos y enlaces absolutos.

### Opcionales (recomendadas)

```env
NUXT_PUBLIC_CONTACT_EMAIL=contacto@tu-dominio.com
NUXT_PUBLIC_CONTACT_WHATSAPP=5493XXXXXXXX
```

Redes: `app/app.config.ts` → `social.linkedin`, `instagram`, etc.

### Solo si activás Mercado Pago

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_SANDBOX=false
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role
```

Sin `MERCADOPAGO_ACCESS_TOKEN` el campus funciona igual: cursos gratuitos (precio 0) e inscripción manual desde admin. Ver `docs/FASE-6.md`.

**Nunca** expongas `SUPABASE_SERVICE_ROLE_KEY` en el cliente; solo en el servidor del hosting.

---

## Vercel (recomendado)

1. Importá el repo en [vercel.com](https://vercel.com)
2. **Framework preset:** Nuxt
3. **Build command:** `npm run build`
4. **Install command:** `npm install`
5. Output: lo resuelve Nitro automáticamente (no configurar `dist` manual)
6. Cargá las variables de la sección anterior
7. Deploy

Tras el deploy, copiá la URL final en `NUXT_PUBLIC_APP_URL` si usás dominio custom.

---

## VPS / Node (alternativa)

```bash
npm ci
npm run build
node .output/server/index.mjs
```

- Puerto por defecto Nitro: `3000` (configurable con `PORT` / `NITRO_PORT`)
- Detrás de nginx o Caddy con TLS y proxy a `127.0.0.1:3000`
- Mismas variables de entorno que en Vercel
- Proceso persistente: systemd, PM2 o similar

Preview local del build de producción:

```bash
npm run build
npm run preview
```

---

## Supabase en producción

### Authentication → URL configuration

| Campo | Ejemplo |
|-------|---------|
| **Site URL** | `https://tu-dominio.com` |
| **Redirect URLs** | `https://tu-dominio.com/**` |

Mínimo incluir:

- `https://tu-dominio.com/campus/login`
- `https://tu-dominio.com/campus/dashboard`
- `https://tu-dominio.com/campus/registro`

### Base de datos

- Todas las migraciones en `supabase/migrations/` aplicadas en el proyecto de **producción**
- No ejecutar `npm run seed:all` en prod (solo usuarios de desarrollo)

### Storage

Buckets usados por la app: `announcement-media`, uploads del editor, etc. Las políticas vienen en las migraciones.

---

## Checklist post-deploy

### Sitio y campus

- [x] `/` carga marketing (hero, contacto, WhatsApp)
- [x] `/campus` catálogo y programas públicos
- [x] Login / registro / recuperar contraseña (Auth URLs configuradas)
- [ ] Panel alumno, docente y admin según rol (smoke manual)

### Académico

- [x] Crear curso, módulos y clases (admin)
- [x] Inscripción manual o gratuita
- [x] **Solicitudes** → Importar Excel → Crear listos → CSV de claves
- [x] Alta masiva verdes desde `INSCRIPTOS DIPLOMATURA.xlsx` (script `alumnos:provision`)
- [ ] Progreso y certificado al 100%
- [ ] Certificado público `/campus/certificados/[codigo]`

### Comunicaciones

- [ ] Anuncios públicos y por audiencia
- [ ] Buzón interno entre roles

### Opcional (pagos) — pendiente / fuera de alcance actual

- [ ] Checkout Mercado Pago en curso de pago
- [ ] Webhook `POST /api/payments/webhook` configurado en MP

---

## Alta de usuarios reales (producción)

**No** uses `campus.*@test.emerge.local` ni `npm run seed:all` / `seed:manual` en prod.

Opciones:

1. **Admin → Alumnos → Nuevo alumno** (ficha + contraseña temporal)
2. **Admin → Solicitudes → Importar Excel** → Crear listos → descargar CSV
3. Crear el primer `superadmin` desde Supabase (SQL de roles en `SETUP-SUPABASE.md`)

---

## Staging vs producción

| | Staging | Producción |
|---|---------|------------|
| Supabase | Proyecto separado (recomendado) | Proyecto prod |
| `NUXT_PUBLIC_APP_URL` | `https://staging.tu-dominio.com` | `https://tu-dominio.com` |
| Mercado Pago | `MERCADOPAGO_SANDBOX=true` | `false` + credenciales prod |
| Seeds de prueba | `npm run seed:all` permitido | **No** |

---

## Documentación relacionada (este repo)

| Archivo | Contenido |
|---------|-----------|
| `docs/SETUP-SUPABASE.md` | Proyecto Supabase y primer admin |
| `docs/MIGRACIONES.md` | Orden de SQL |
| `docs/FASE-6.md` | Mercado Pago y webhooks |
| `docs/PROXIMOS-PASOS.md` | Qué probar en local |
| `README.md` | Comandos `npm` del proyecto |

---

## Troubleshooting

**Login redirige mal** → Revisá Redirect URLs en Supabase y que `NUXT_PUBLIC_APP_URL` coincida con el dominio real.

**Anuncios no visibles sin login** → Migración `20260327800000_fix_public_announcements_anon.sql` aplicada.

**Pagos 503** → Falta `MERCADOPAGO_ACCESS_TOKEN` en el servidor.

**Build falla en CI** → Node 20+, `npm ci` y variables `NUXT_PUBLIC_*` definidas en el pipeline.
