# Importar inscriptos (Excel Diplomatura)

## Qué hace

1. Importa el Excel con colores:
   - **Verde** → estado `ready` (listo para crear usuario)
   - **Naranja** → estado `pending` (en duda, no crear aún)
2. Guarda la **ficha** (nombre, email, WhatsApp, audiencia, desafío, rol, ocupación, ciudad).
3. Convierte los `ready` en:
   - cuenta Auth + perfil alumno
   - inscripción al curso elegido
4. Genera CSV de **contraseñas temporales** para enviar por WhatsApp/mail.

## Quién puede usarlo

`superadmin`, `admin`, `coordinador` → menú **Solicitudes**.

## Pasos

1. Aplicar migración: `npm run db:migrate` (incluye `20260327900000_enrollment_applications.sql`).
2. Crear/publicar el curso **Diplomatura** en Admin → Cursos (si no existe).
3. Ir a **Admin → Solicitudes → Importar Excel**.
4. Elegir el curso destino y el archivo `.xlsx`.
5. Revisar listos vs en duda. Podés marcar naranjas como listos cuando confirmen.
6. **Crear todos los listos** (o seleccionar filas).
7. **Descargar contraseñas CSV** y comunicar a cada alumno: email + contraseña → `/campus/login`.

## Notas

- Reimportar el mismo email+curso actualiza la ficha (no pisa los ya convertidos).
- Si el email ya tenía cuenta, se reutiliza y se inscribe al curso (sin nueva contraseña).
- Los naranja no reciben acceso hasta pasarlos a listos y convertirlos.
