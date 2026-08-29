# Fase 5 — Auditoría, reportes y logs de actividad

Ejecutá en **Supabase → SQL Editor** el archivo:

```
supabase/migrations/20260326500000_phase5_audit_reports.sql
```

Si el panel admin falla por permisos en vistas nuevas, también ejecutá (o re-ejecutá):

```
supabase/migrations/20260326310000_fix_admin_panel.sql
```

Esto crea:

- `audit_logs` — registro de actividad del campus
- Triggers automáticos en cursos, inscripciones, notas, anuncios y asistencia
- Vistas de reportes: `campus_report_summary`, `course_performance_report`, `enrollment_report`
- Vista `admin_activity_log` para el panel de auditoría

## Probar como admin

1. Entrá a `/campus/admin/reportes`
2. Revisá los KPIs: inscripciones, progreso, asistencia, notas y actividad de los últimos 30 días
3. Exportá **Inscripciones CSV** o **Rendimiento CSV**
4. Entrá a `/campus/admin/auditoria`
5. Filtrá por acción, tipo de entidad, curso o período
6. Realizá una acción (crear curso, inscribir alumno, cargar nota) y verificá que aparece en el log

## Eventos auditados automáticamente

| Entidad | Eventos registrados |
|---------|---------------------|
| Cursos | Creación, actualización, cambio de estado, eliminación |
| Inscripciones | Alta, cambio de estado/progreso |
| Calificaciones | Carga y actualización de nota |
| Anuncios | Creación, publicación, cambio de estado, eliminación |
| Asistencia | Registro y cambio de estado |

## Rutas nuevas

| Ruta | Descripción |
|------|-------------|
| `/campus/admin/reportes` | Dashboard de métricas + exportación CSV |
| `/campus/admin/auditoria` | Log de actividad con filtros |

## Próxima fase

Fase 6 implementada. Ver `docs/FASE-6.md` (pagos, certificados, videoconferencia).
