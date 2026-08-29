# Emerge Group Consultora

Sitio institucional y **Campus virtual** (Nuxt 4 + Supabase): marketing, formación online, inscripciones, comunicaciones, certificados y panel admin.

## Requisitos

- Node.js 20+
- Proyecto Supabase configurado (ver `docs/SETUP-SUPABASE.md`)

## Inicio rápido

```bash
npm install
cp .env.example .env   # completar URL y keys de Supabase
npm run db:migrate
npm run seed:all       # usuarios + datos demo del campus
npm run dev
```

- Sitio: http://localhost:3000
- Campus: http://localhost:3000/campus
- Login prueba: `docs/USUARIOS-PRUEBA.md`

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:migrate` | Aplicar migraciones SQL |
| `npm run db:types` | Regenerar tipos TypeScript desde Supabase |
| `npm run seed:all` | Usuarios de prueba + cohortes demo |
| `npm run test:integration` | Pruebas de buzón y anuncios |

## Configuración de marca

| Qué | Dónde |
|-----|-------|
| Email, WhatsApp, logos | `app/app.config.ts` |
| Override sin código | `.env` → `NUXT_PUBLIC_CONTACT_EMAIL`, `NUXT_PUBLIC_CONTACT_WHATSAPP` |
| Colores | `app/assets/css/tokens.css` + `app.config.ts` → `colors` |
| Redes sociales | `app.config.ts` → `social` |

## Documentación

- `docs/PROXIMOS-PASOS.md` — qué probar y qué falta
- `docs/SETUP-SUPABASE.md` — base de datos y roles
- `docs/DEPLOY.md` — publicación
- `docs/FASE-*.md` — funcionalidades por fase
- `docs/FASE-6.md` — Mercado Pago (opcional)

## Estructura

- `app/` — Nuxt (páginas, componentes, composables)
- `supabase/migrations/` — esquema Postgres
- `scripts/` — seeds y migraciones
- `public/` — assets estáticos
