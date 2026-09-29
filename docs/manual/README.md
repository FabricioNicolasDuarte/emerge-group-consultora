# Manuales del Campus Emerge

## 1. Guía para alumnos y docentes (amigable)

**[`GUIA-ALUMNOS-DOCENTES.html`](./GUIA-ALUMNOS-DOCENTES.html)**

Manual práctico, en lenguaje simple, **solo para alumnos y docentes**.  
Sin referencias técnicas. Dominio: `www.emergegroupconsultora.com.ar`.

Abrilo en el navegador → **Imprimir / Guardar PDF** (Ctrl+P).

## 2. Manual operativo completo (incluye administración)

**[`MANUAL-USUARIO-CAMPUS.html`](./MANUAL-USUARIO-CAMPUS.html)**

Versión detallada para coordinación/admin (importación Excel, reportes, auditoría, etc.).  
**Versión 1.2.**

## Regenerar capturas

Las imágenes viven en `assets/` y las usan ambos documentos.

```bash
npm run seed:manual
npm run dev
# otra terminal:
npm run manual:capture
```

Credenciales demo: `docs/USUARIOS-PRUEBA.md` (solo desarrollo).
