# Usuarios de prueba — Campus Emerge (solo desarrollo)

Generados automáticamente. **No usar en producción.**

| Rol | Email | Contraseña | Panel |
|-----|-------|------------|-------|
| Alumno | campus.alumno@test.emerge.local | CampusEmerge2026! | /campus/student |
| Docente | campus.docente@test.emerge.local | CampusEmerge2026! | /campus/teacher |
| Superadmin | campus.admin@test.emerge.local | CampusEmerge2026! | /campus/admin |

Login: http://localhost:3000/campus/login

Los UUID en este archivo pueden cambiar si regenerás usuarios con `npm run seed:test-users`.

- **alumno**: `15e7717d-ada2-47ac-a45c-3164b63662b2`
- **docente**: `0e397480-9fd9-4a90-8194-88357ac982bf`
- **superadmin**: `19453f1b-8f48-4ed2-9d01-f9c173fd0972`

Para regenerar: `npm run seed:test-users`
