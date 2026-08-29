# Fase 2 — Contenido, clases y progreso

Ejecutá en **Supabase → SQL Editor** el archivo:

```
supabase/migrations/20260326200000_phase2_content.sql
```

Esto agrega:
- Columna `content_html` en clases
- Tablas `lesson_materials` y `lesson_completions`
- Sincronización automática del progreso de inscripción
- Políticas de Storage para subir/descargar materiales
- Clases de ejemplo en Liderazgo Sanmartiniano (módulos 1 y 3)

## Probar el flujo alumno

1. Asegurate de estar inscripto en un curso (ver Fase 1)
2. Entrá a `/campus/student` → **Continuar curso**
3. En `/campus/cursos/liderazgo-sanmartiniano` verás módulos y clases desde la DB
4. Abrí una clase → reproductor de video (si tiene URL) + contenido HTML
5. **Marcar como completada** → el progreso de inscripción se actualiza solo

## Gestionar contenido (admin/docente)

1. Entrá a `/campus/admin`
2. En la tabla de cursos, click en **Contenido**
3. Podés:
   - Crear módulos
   - Agregar clases con URL de YouTube/Vimeo
   - Publicar/ocultar clases
   - Editar título, descripción y HTML
   - Subir PDFs y materiales

### URL de video soportadas

- YouTube: `https://www.youtube.com/watch?v=...` o `youtu.be/...`
- Vimeo: `https://vimeo.com/...`
- MP4 directo: URL que termine en `.mp4`

## Storage

Los archivos se guardan en el bucket `course-materials` con path:

```
{course_id}/{lesson_id}/{archivo}
```

Solo alumnos inscriptos, docentes del curso y staff pueden descargarlos.

## Rutas nuevas

| Ruta | Descripción |
|------|-------------|
| `/campus/cursos/[slug]` | Página dinámica del curso |
| `/campus/cursos/[slug]/[lessonId]` | Vista de clase con video y materiales |
| `/campus/admin/cursos/[courseId]/contenido` | Editor de módulos/clases |

## Notas

- Las páginas estáticas `liderazgo-sanmartiniano.vue` fueron reemplazadas por rutas dinámicas
- Usuarios no inscriptos ven el curso público pero no pueden abrir las clases
- El progreso se calcula: `(clases completadas / clases publicadas) × 100`
