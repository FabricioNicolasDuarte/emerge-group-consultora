# Fase 6 — Pagos, certificados y videoconferencia

Ejecutá en **Supabase → SQL Editor**:

```
supabase/migrations/20260326600000_phase6_commerce.sql
```

Si hay errores de permisos, re-ejecutá también:

```
supabase/migrations/20260326310000_fix_admin_panel.sql
```

## Variables de entorno

Agregá a tu `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_SANDBOX=true
NUXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_KEY=eyJ...service_role
```

- `MERCADOPAGO_ACCESS_TOKEN`: credencial de tu app en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
- `MERCADOPAGO_SANDBOX=true`: usa URLs de prueba en desarrollo
- `SUPABASE_SERVICE_KEY`: necesaria para el webhook que confirma pagos e inscribe al alumno

Reiniciá `npm run dev` después de cambiar el `.env`.

## Qué incluye esta fase

### Pagos (Mercado Pago)
- Precio por curso (`price_amount`, 0 = gratuito)
- Checkout Pro vía `/api/payments/create-preference`
- Webhook `/api/payments/webhook` confirma pago e inscribe automáticamente
- Página de resultado: `/campus/pagos/resultado`

### Certificados PDF
- Emisión automática al completar 100% del curso
- Emisión manual desde `/campus/admin/certificados`
- Vista pública verificable: `/campus/certificados/[codigo]`
- Descarga/imprimí como PDF desde el navegador

### Videoconferencia
- Link de reunión en cada sesión de asistencia (`meeting_url`)
- Widget "Próximas clases en vivo" en panel alumno y docente

## Probar pagos (sandbox)

1. En admin, creá un curso publicado con precio > 0
2. Como alumno, entrá al curso y clic en **Pagar**
3. Usá tarjetas de prueba de Mercado Pago
4. Al aprobar, volvés a `/campus/pagos/resultado` y quedás inscripto

## Probar certificados

1. Completá un curso al 100% (o emití manualmente desde admin)
2. En panel alumno → **Mis certificados** → **Ver certificado**
3. Verificá que el código funciona en `/campus/certificados/[codigo]` sin login

## Probar videoconferencia

1. En `/campus/admin/cursos/[id]/asistencia`, creá una sesión con link de Jitsi/Meet/Zoom
2. Como alumno inscripto, aparece en "Próximas clases en vivo"

## Rutas nuevas

| Ruta | Descripción |
|------|-------------|
| `/campus/admin/certificados` | Gestión de certificados |
| `/campus/certificados/[code]` | Verificación pública + PDF |
| `/campus/pagos/resultado` | Retorno de Mercado Pago |
| `POST /api/payments/create-preference` | Inicia checkout |
| `POST /api/payments/webhook` | Notificaciones MP |

## Webhook en producción

Configurá en Mercado Pago la URL:

```
https://TU_DOMINIO/api/payments/webhook
```

Y actualizá `NUXT_PUBLIC_APP_URL` con tu dominio real.
