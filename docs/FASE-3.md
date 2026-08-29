# Fase 3 — Asistencia y calificaciones

Ejecutá en **Supabase → SQL Editor** el archivo:

```
supabase/migrations/20260326300000_phase3_attendance_grades.sql
```

Esto crea:
- `course_sessions` — encuentros sincrónicos/presenciales
- `attendance_records` — asistencia por alumno y sesión
- `assessments` — evaluaciones del curso
- `student_grades` — notas por evaluación
- Vistas para alumnos (`my_attendance`, `my_grades`, etc.)
- 3 sesiones y 3 evaluaciones de ejemplo en Liderazgo Sanmartiniano

## Probar como admin/docente

1. Entrá a `/campus/admin`
2. En un curso, click en **Asistencia** o **Notas**
3. **Asistencia:**
   - Creá una sesión (título + fecha)
   - Seleccionala y marcá presente/ausente/tarde/justificado por alumno
   - Usá **Marcar todos presentes** para cargar rápido
4. **Calificaciones:**
   - Creá una evaluación (título, puntaje máximo, peso %)
   - Cargá notas en el libro de calificaciones
   - Click en **Guardar notas**
   - Publicá/ocultá evaluaciones para que el alumno las vea

## Probar como alumno

1. Entrá a `/campus/student`
2. Secciones nuevas:
   - **Mi asistencia** — % por curso y detalle de encuentros
   - **Mis notas** — evaluaciones publicadas con puntaje y feedback

> Las notas solo se muestran si la evaluación está **publicada**.

## Rutas nuevas

| Ruta | Descripción |
|------|-------------|
| `/campus/admin/cursos/[courseId]/asistencia` | Gestión de sesiones y asistencia |
| `/campus/admin/cursos/[courseId]/calificaciones` | Libro de notas |

Docentes con curso asignado (`course_assignments`) también pueden acceder a estas rutas.

## Estados de asistencia

| Valor | Etiqueta |
|-------|----------|
| `present` | Presente |
| `absent` | Ausente |
| `late` | Tarde |
| `excused` | Justificado |

Presente y Tarde cuentan como asistencia para el porcentaje.

## Próxima fase

Fase 4: notificaciones y anuncios del campus.
