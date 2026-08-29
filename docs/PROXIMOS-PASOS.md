# Próximos pasos (sin Mercado Pago)

## Ya podés usar hoy

| Función | Cómo probarlo |
|---------|----------------|
| Cursos y contenido | Admin → crear curso → Contenido / Asistencia / Notas |
| Inscripción gratuita | Curso con precio **0** → alumno → **Inscribirme gratis** |
| Inscripción manual | Admin → **+ Nueva inscripción** |
| Certificados | Completar 100% o admin → `/campus/admin/certificados` |
| Videoconferencia | Asistencia del curso → link de reunión |
| Comunicaciones | `/campus/admin/comunicaciones` |
| Reportes / auditoría | `/campus/admin/reportes` y `/campus/admin/auditoria` |

## Recomendado ahora

1. **Cargar contenido real** — al menos un curso publicado con módulos y clases
2. **Usuarios de prueba** — un alumno, un docente, un admin (SQL de roles en `SETUP-SUPABASE.md`)
3. **Deploy staging** — seguir `docs/DEPLOY.md` con tu dominio de prueba
4. **Tipos Supabase** — cuando tengas acceso CLI: `npm run db:types`

## Regenerar datos demo

```bash
npm run seed:all
```

Esto crea usuarios de prueba y configura cohortes/cupos en los cursos de ejemplo.

## Dejado para más adelante

- Mercado Pago (`docs/FASE-6.md`)
- Emails transaccionales (inscripción, certificado)
- Optimización de imágenes en `public/`
- Integración Zoom API automática
