# Fase 4 — Anuncios y notificaciones

Ejecutá en **Supabase → SQL Editor** el archivo:

```
supabase/migrations/20260326400000_phase4_comms.sql
```

Si todavía no corriste el hotfix de permisos, también ejecutá:

```
supabase/migrations/20260326310000_fix_admin_panel.sql
```

Esto crea:
- `announcements` — avisos del campus (global, alumnos, docentes o por curso)
- `notifications` — bandeja personal por usuario
- Triggers automáticos al inscribir, publicar nota o publicar anuncio
- 2 anuncios de ejemplo

## Probar como admin

1. Entrá a `/campus/admin/comunicaciones`
2. Creá un anuncio y elegí audiencia:
   - **Todo el campus** — visible en `/campus` (público) y paneles
   - **Alumnos / Docentes** — solo ese rol
   - **Curso específico** — inscriptos y docentes del curso
3. Publicá el anuncio → se generan notificaciones automáticas
4. En **Notificación manual** podés enviar un mensaje directo a un alumno

## Probar como alumno

1. Entrá a `/campus/student`
2. Sección **Avisos** — anuncios relevantes para vos
3. **Mis notificaciones** — bandeja con badge de no leídas
4. Click en una notificación → se marca como leída y navega al enlace

## Notificaciones automáticas

| Evento | Notificación |
|--------|----------------|
| Nueva inscripción | "Inscripción confirmada" → link al curso |
| Nota publicada | "Nueva calificación" → sección notas |
| Anuncio publicado | Copia del anuncio en la bandeja |

## Rutas nuevas

| Ruta | Descripción |
|------|-------------|
| `/campus/admin/comunicaciones` | CMS de anuncios y envío manual |
| `/campus` (sección Novedades) | Avisos públicos para todos |

## Próxima fase

Fase 5: auditoría, reportes y logs de actividad. Ver `docs/FASE-5.md`.
