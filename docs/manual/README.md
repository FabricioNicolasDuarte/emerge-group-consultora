# Manual de Usuario — Campus Emerge

## Archivo principal

Abrí en el navegador:

**[`MANUAL-USUARIO-CAMPUS.html`](./MANUAL-USUARIO-CAMPUS.html)**

Luego usá **Imprimir / Guardar PDF** (Ctrl+P).  
Recomendado: márgenes por defecto e incluir fondos gráficos.

El HTML incluye:

- Portada
- Índice con anclas
- Capítulos por rol (alumno, docente, admin/coordinación)
- Capturas en `assets/`
- Encabezados y pies de página al imprimir (`@page`)

## Regenerar datos + capturas

```bash
# 1. Contenido prolijo (borra datos feos, conserva usuarios seed)
npm run seed:manual

# 2. Capturas del manual (servidor en :3000)
npm run manual:capture
```

Credenciales: `docs/USUARIOS-PRUEBA.md` (nombres presentables: Marina / Diego / Lucía).

## Relacionado

- `docs/IMPORT-INSCRIPTOS.md` — detalle del flujo Excel
- `docs/USUARIOS-PRUEBA.md` — cuentas demo
