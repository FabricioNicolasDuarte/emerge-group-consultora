# Configuración de Supabase — Campus Emerge

Seguí estos pasos **en orden**. La app ya está preparada en código; falta conectar tu proyecto Supabase.

---

## Paso 1 — Crear proyecto en Supabase

1. Entrá a [https://supabase.com](https://supabase.com) e iniciá sesión.
2. **New project**
3. Nombre sugerido: `campus-emerge`
4. Elegí contraseña de base de datos (guardala en un lugar seguro).
5. Región: la más cercana (ej. South America si está disponible).
6. Esperá a que el proyecto termine de crearse (~2 min).

---

## Paso 2 — Ejecutar las migraciones SQL

Ejecutá **en orden** cada archivo de `supabase/migrations/` en el SQL Editor. Lista completa en `docs/MIGRACIONES.md`.

Mínimo para arrancar (si es instalación nueva, corré **todas**):

1. `20260326000000_phase0_foundation.sql`
2. `20260326100000_phase1_academic.sql`
3. … hasta `20260326600000_phase6_commerce.sql`
4. Si el panel admin falla: `20260326310000_fix_admin_panel.sql`

La Fase 0 crea:
- Tablas `profiles`, `roles`, `user_roles`
- Roles: superadmin, admin, coordinador, docente, tutor, alumno
- Trigger para crear perfil al registrarse
- Políticas RLS (seguridad por fila)
- Vista `my_profile` para el frontend

---

## Paso 3 — Variables de entorno locales

1. En Supabase: **Project Settings** → **API**
2. Copiá:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY`
3. En la raíz del proyecto, creá el archivo `.env`:

```env
NUXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Reiniciá el servidor de desarrollo si estaba corriendo:

```bash
npm run dev
```

---

## Paso 4 — Crear tu usuario administrador

### 4a. Crear usuario en Auth

1. Supabase → **Authentication** → **Users** → **Add user**
2. Email: tu correo
3. Password: una contraseña segura
4. Marcá **Auto Confirm User** (para no depender del mail de confirmación en dev).

### 4b. Asignar rol superadmin

1. En **Users**, copiá el **UUID** del usuario.
2. **SQL Editor** → nueva query:

```sql
-- Reemplazá YOUR_USER_UUID por el UUID copiado
insert into public.user_roles (user_id, role_id)
select 'YOUR_USER_UUID'::uuid, id
from public.roles
where slug = 'superadmin'
on conflict do nothing;
```

3. Run.

---

## Paso 5 — Probar la app

```bash
cd C:\Users\fabri\EmergeGroupConsultora
npm run dev
```

1. Abrí `http://localhost:3000/campus/login`
2. Ingresá con el usuario creado.
3. Deberías ir a `/campus/admin` (si tenés rol superadmin/admin/coordinador).
4. Un usuario sin rol staff iría a `/campus/student`.

### Rutas por rol

| Rol | Dashboard |
|-----|-----------|
| superadmin, admin, coordinador | `/campus/admin` |
| docente, tutor | `/campus/teacher` |
| alumno | `/campus/student` |

---

## Paso 6 (opcional) — Desactivar confirmación de email en dev

Para facilitar pruebas:

1. **Authentication** → **Providers** → **Email**
2. Desactivá **Confirm email** (solo en desarrollo).

---

## Crear más usuarios de prueba

Podés crear usuarios desde el dashboard y asignar roles:

```sql
-- Ejemplo: hacer docente a un usuario
insert into public.user_roles (user_id, role_id)
select 'UUID_DEL_USUARIO'::uuid, id
from public.roles
where slug = 'docente';
```

Un usuario puede tener **varios roles**. La app usa el de mayor jerarquía para el dashboard.

---

## Solución de problemas

| Problema | Qué revisar |
|----------|-------------|
| Error al login | URL y KEY en `.env`, usuario confirmado en Auth |
| Redirige a login siempre | Reiniciar `npm run dev` después de crear `.env` |
| `my_profile` vacío | ¿Corriste la migración SQL? ¿Existe fila en `profiles`? |
| Va a `/campus/student` siendo admin | Ejecutá el SQL de asignación de rol superadmin |
| Error RLS | Verificá que el usuario tenga fila en `user_roles` |

---

## Documentación del campus

| Archivo | Tema |
|---------|------|
| `docs/MIGRACIONES.md` | Orden de SQL |
| `docs/PROXIMOS-PASOS.md` | Qué usar sin pagos |
| `docs/DEPLOY.md` | Publicar en producción |
| `docs/FASE-1.md` … `FASE-6.md` | Detalle por fase |

---

## Próximo paso

Con el `.env` y las migraciones listas, cargá un curso de prueba y probá el flujo alumno completo. Ver `docs/PROXIMOS-PASOS.md`.
