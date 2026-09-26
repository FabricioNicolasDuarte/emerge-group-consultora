# Migraciones SQL — Campus Emerge

Ejecutá en **Supabase → SQL Editor**, **en este orden**:

| # | Archivo | Contenido |
|---|---------|-----------|
| 0 | `20260326000000_phase0_foundation.sql` | Auth, perfiles, roles |
| 1 | `20260326100000_phase1_academic.sql` | Cursos, módulos, inscripciones |
| 2 | `20260326200000_phase2_content.sql` | Clases, materiales, storage |
| 3 | `20260326300000_phase3_attendance_grades.sql` | Asistencia y notas |
| — | `20260326310000_fix_admin_panel.sql` | Hotfix permisos admin |
| 4 | `20260326400000_phase4_comms.sql` | Anuncios y notificaciones |
| 5 | `20260326500000_phase5_audit_reports.sql` | Auditoría y reportes |
| 6 | `20260326600000_phase6_commerce.sql` | Certificados, precios, videoconferencia |
| 7 | `20260327900000_enrollment_applications.sql` | Ficha / solicitudes + import Excel |

Si algo falla por permisos en vistas, re-ejecutá `20260326310000_fix_admin_panel.sql`.

Guías por fase: `docs/FASE-1.md` … `docs/FASE-6.md`.
Import de Diplomatura: `docs/IMPORT-INSCRIPTOS.md`.
