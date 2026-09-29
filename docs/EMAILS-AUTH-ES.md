# Correos con marca Emerge Group (español, sin Supabase)

Hay **dos canales**:

| Canal | Quién envía | Marca |
|-------|-------------|--------|
| **App Nuxt** (SMTP / Resend) | Restablecer contraseña, avisos del buzón, soporte | Código: `server/utils/email-brand.ts` |
| **Supabase Auth** | Confirmación, invite, magic link, change email | Plantillas del dashboard + SMTP propio |

El **«Olvidé mi contraseña»** del campus genera el link y manda el HTML de marca vía Gmail/SMTP del `.env` (no usa el mailer de Supabase).

---

## 1) Remitente propio (Auth de Supabase)

**Project Settings → Authentication → SMTP Settings** → Enable Custom SMTP.

| Campo | Valor |
|-------|--------|
| Sender email | `emergegroup.fsa@gmail.com` |
| Sender name | `Emerge Group · Campus` |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | el mismo Gmail |
| Password | contraseña de aplicación de Google |

En Vercel / `.env` Nuxt: `SMTP_FROM=Emerge Group · Campus <emergegroup.fsa@gmail.com>` (mismo buzón).

---

## 2) Plantillas Auth — layout de marca

**Authentication → Email Templates**. Colores: tinta `#0d2c54`, acento `#f28c28`, botón `#2563eb`.

### Confirm signup

**Subject:** `Campus Emerge · Confirmá tu cuenta`

```html
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f6f8fb">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
        <tr><td style="background:#0d2c54;padding:18px 24px">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#f28c28;font-weight:700">Emerge Group Consultora</p>
          <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff">Campus Emerge</p>
        </td></tr>
        <tr><td style="height:4px;background:#f28c28;font-size:0;line-height:0">&nbsp;</td></tr>
        <tr><td style="padding:28px 24px;font-family:Arial,sans-serif;color:#0d2c54">
          <h1 style="margin:0 0 16px;font-size:20px">Confirmá tu cuenta</h1>
          <p style="margin:0 0 12px;line-height:1.55">Hola. Para activar tu cuenta en el Campus, hacé clic en el botón:</p>
          <p style="margin:22px 0 0"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700">Confirmar mi correo</a></p>
          <p style="margin:24px 0 0;font-size:14px;color:#66768a">Si no creaste esta cuenta, ignorá este mensaje.</p>
          <p style="margin:16px 0 0;font-size:14px;color:#66768a">— Equipo Campus Emerge</p>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f6f8fb;border-top:1px solid #e2e8f0;font-family:Arial,sans-serif;font-size:12px;color:#66768a">Emerge Group Consultora · Formación y consultoría.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

### Magic Link

**Subject:** `Campus Emerge · Tu enlace de acceso`

Mismo HTML; cambiá el `h1` a `Acceso al Campus`, el párrafo a «Usá este enlace para ingresar (vence en poco tiempo):», el CTA a `Ingresar al Campus`, y la nota a «Si no lo pediste, ignorá este correo.»

### Change Email Address

**Subject:** `Campus Emerge · Confirmá tu nuevo correo`

Mismo HTML; `h1` = `Cambio de correo`; texto: `Para confirmar el nuevo correo ({{ .Email }}), hacé clic:`; CTA `Confirmar nuevo correo`.

### Reset Password (flujo nativo Supabase; el campus usa Nuxt)

**Subject:** `Campus Emerge · Restablecé tu contraseña`

Mismo HTML; `h1` = `Restablecer contraseña`; texto de pedido de cambio; CTA `Elegir una contraseña nueva`; nota «Si no pediste este cambio, ignorá el mensaje.»

### Invite user

**Subject:** `Campus Emerge · Te invitaron al Campus`

Mismo HTML; `h1` = `Invitación al Campus`; texto «Te invitaron a unirte al Campus Emerge.»; CTA `Aceptar invitación`.

---

## 3) Redirect URLs

**Authentication → URL Configuration**: Site URL de prod + `/campus/restablecer-contrasena`, `/campus/login`, `/campus/dashboard`, y `/**`. Local: `http://localhost:3000/**`.

---

## 4) Ya branded en código

| Evento | Dónde |
|--------|--------|
| Restablecer contraseña | `/api/campus/auth/request-password-reset` |
| Notif. buzón | `/api/campus/mailbox/notify-email` |
| Soporte | `/api/campus/support` |
| Layout | `server/utils/email-brand.ts` |

---

## 5) Probar

1. Olvidé mi contraseña → mail con header azul/naranja y remitente **Emerge Group · Campus**.
2. Buzón con «notificar por correo».
