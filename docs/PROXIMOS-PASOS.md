# Próximos pasos (sin Mercado Pago)

## Ya podés usar hoy

| Función | Cómo probarlo |
|---------|----------------|
| Cursos y contenido | Admin → crear curso → Contenido / Asistencia / Notas |
| Inscripción gratuita | Curso con precio **0** → alumno → **Inscribirme gratis** |
| Inscripción manual | Admin → **+ Nueva inscripción** |
| Alta masiva Diplomatura | Admin → **Solicitudes** → Importar Excel (verdes/naranjas) |
| Certificados | Completar 100% o admin → `/campus/admin/certificados` |
| Videoconferencia | Asistencia del curso → link de reunión |
| Comunicaciones | `/campus/admin/comunicaciones` |
| Reportes / auditoría | `/campus/admin/reportes` y `/campus/admin/auditoria` |

## Recomendado ahora

1. **Cargar contenido real** — al menos un curso publicado con módulos y clases
2. **Usuarios de prueba** — un alumno, un docente, un admin (SQL de roles en `SETUP-SUPABASE.md`)
3. **Deploy** — seguir `docs/DEPLOY.md` **de este repo** (`EmergeGroupConsultora`, Nuxt + Supabase). No confundir con otros proyectos del workspace (p. ej. serviciosclientes / ECOM).
4. **Tipos Supabase** — cuando tengas acceso CLI: `npm run db:types`

## Regenerar datos demo

```bash
npm run seed:all
```

Esto crea usuarios de prueba y configura cohortes/cupos en los cursos de ejemplo.

## Configuración de marca y contacto

| Qué | Dónde |
|-----|-------|
| Email, WhatsApp, mensaje WA | `app/app.config.ts` → `contact` |
| Sobreescribir sin código | `.env` → `NUXT_PUBLIC_CONTACT_EMAIL`, `NUXT_PUBLIC_CONTACT_WHATSAPP` |
| Redes sociales | `app/app.config.ts` → `social` (el footer oculta las vacías) |
| Colores (JS + CSS) | `app/app.config.ts` → `colors` y `app/assets/css/tokens.css` |

## Dejado para más adelante

- Mercado Pago (`docs/FASE-6.md`)
- Emails transaccionales (inscripción, certificado)
- Optimización de imágenes en `public/`
- Integración Zoom API automática
