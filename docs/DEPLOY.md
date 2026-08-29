# Deploy — Campus Emerge (sin pagos)

## Requisitos mínimos

Variables en el hosting (Vercel, Netlify, etc.):

```env
NUXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=eyJ...anon
NUXT_PUBLIC_APP_URL=https://tu-dominio.com
```

**Mercado Pago es opcional.** Sin `MERCADOPAGO_ACCESS_TOKEN` el campus funciona en modo gratuito (cursos con precio 0 + inscripción manual admin).

## Vercel (recomendado para Nuxt)

1. Conectá el repositorio en [vercel.com](https://vercel.com)
2. Framework preset: **Nuxt**
3. Build command: `npm run build`
4. Output: manejado por Nitro (no hace falta configurar `dist`)
5. Agregá las variables de entorno
6. Deploy

## Supabase en producción

1. **Authentication → URL configuration**: agregá tu dominio en Site URL y Redirect URLs
   - `https://tu-dominio.com/campus/dashboard`
   - `https://tu-dominio.com/campus/login`
2. Verificá que todas las migraciones de `docs/MIGRACIONES.md` estén aplicadas

## Checklist post-deploy

- [ ] Login admin y alumno
- [ ] Crear curso, contenido, inscripción manual
- [ ] Alumno completa clases → certificado
- [ ] Sesión con link de videoconferencia visible
- [ ] Reportes y auditoría en admin
- [ ] Certificado público `/campus/certificados/[codigo]`

## Cuando actives pagos

Agregá `MERCADOPAGO_ACCESS_TOKEN`, `SUPABASE_SERVICE_KEY` y configurá el webhook en Mercado Pago:

```
https://tu-dominio.com/api/payments/webhook
```

Ver `docs/FASE-6.md`.
