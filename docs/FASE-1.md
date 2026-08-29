# Fase 1 — Núcleo académico

Ejecutá en **Supabase → SQL Editor** el archivo:

```
supabase/migrations/20260326100000_phase1_academic.sql
```

Esto crea tablas de cursos, módulos, clases, inscripciones, vistas, RLS y datos iniciales.

## Probar como admin

1. Entrá a `/campus/admin`
2. Deberías ver los 3 cursos (2 publicados, 1 borrador)
3. Creá un curso nuevo con **+ Nuevo curso**
4. Publicá/ocultá cursos con el botón **Publicar / Ocultar**

## Inscribir un alumno

Para probar el panel alumno necesitás un usuario con rol `alumno` inscripto en un curso.

### Opción A — Crear usuario alumno de prueba

1. **Authentication → Users → Add user** (email de prueba, auto confirm)
2. Ese usuario ya recibe rol `alumno` automáticamente
3. En admin: **+ Nueva inscripción** → elegir curso y alumno

### Opción B — Inscribirte a vos mismo (si sos superadmin)

En SQL Editor:

```sql
insert into public.enrollments (course_id, student_id, progress_percent)
select c.id, 'TU_UUID'::uuid, 25
from public.courses c
where c.slug = 'liderazgo-sanmartiniano'
on conflict do nothing;
```

Luego entrá a `/campus/student` y deberías ver el curso.

## Asignar docente a un curso

```sql
insert into public.course_assignments (course_id, teacher_id, role)
select c.id, 'UUID_DOCENTE'::uuid, 'docente'
from public.courses c
where c.slug = 'liderazgo-sanmartiniano'
on conflict do nothing;
```

El docente verá el curso en `/campus/teacher`.
