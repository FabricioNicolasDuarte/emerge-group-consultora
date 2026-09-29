# Propuesta comercial — Plataforma de Formación Online

**Producto:** Sitio institucional + Campus virtual (LMS)  
**Versión del documento:** 1.0 · Septiembre 2026  
**Moneda de referencia:** USD (facturación en ARS al tipo de cambio acordado)  
**Uso:** documento para presentar a clientes que necesitan una plataforma similar

---

## 1. Qué es el producto

Una aplicación web única con dos caras:

1. **Sitio institucional** — vitrina de servicios, metodología, equipo, testimonios y canales de contacto (WhatsApp / email).
2. **Campus virtual (LMS)** — formación online: catálogo de programas, inscripción, contenidos, asistencia, calificaciones, certificados, comunicaciones internas y panel de administración.

Orientado a **consultoras, academias, institutos, ONG y áreas de formación** que venden o dictan cursos / diplomaturas y necesitan operar el ciclo académico completo sin armar un ERP.

No es un ERP. No es multi-tenant white-label de fábrica. Es una **plataforma dedicada** (una organización = una instancia), con marca configurable.

---

## 2. Capacidades incluidas

### Sitio público
- Home, nosotros, FAQ, legales (privacidad, términos, cookies)
- Contacto por WhatsApp (varios canales) y email
- SEO básico (sitemap, meta, Open Graph)

### Campus — alumno
- Catálogo de cursos (precio, cupos, ventanas de inscripción, badges)
- Mis cursos, progreso, próximas clases en vivo (link Meet / Zoom / Jitsi)
- Asistencia y notas propias
- Certificados descargables + verificación pública por código
- Avisos, buzón interno y perfil

### Campus — docente / tutor
- Cursos asignados, materiales, asistencia, calificaciones
- Comunicaciones de curso y buzón

### Campus — administración / coordinación
| Módulo | Función |
|--------|---------|
| Cursos | Alta, publicar/ocultar, cupos, cohortes, precio |
| Contenido | Módulos, clases (YouTube / Vimeo / MP4 / Drive), HTML rico, materiales PDF |
| Usuarios | Alumnos, docentes, roles |
| Inscripciones | Alta manual alumno ↔ curso |
| Solicitudes | Importación masiva Excel → cuentas + CSV de claves |
| Asistencia | Sesiones, presente/ausente/tarde/justificado, link de videollamada |
| Calificaciones | Evaluaciones, libro de notas, publicar/ocultar |
| Certificados | Emisión manual + automática al 100 % de progreso |
| Comunicaciones | Anuncios por audiencia (global, rol, curso) + editor rico |
| Buzón | Hilos, adjuntos, notificación por email, ingest de respuestas |
| Reportes | KPIs + export CSV |
| Auditoría | Log de actividad |
| Soporte | Ticket por email desde el campus |

### Comercio (opcional)
- Checkout Mercado Pago (Checkout Pro + webhook)
- Sin token de pagos, el campus funciona igual (cursos gratis + inscripción manual)

### Roles
`superadmin` · `admin` · `coordinador` · `docente` · `tutor` · `alumno`  
(un usuario puede tener varios roles; el panel usa el de mayor jerarquía)

### Stack técnico (referencia)
Nuxt 4 + Vue 3 · Supabase (Auth, Postgres con RLS, Storage) · hosting Vercel o VPS Node · email SMTP / Resend · Mercado Pago opcional.

---

## 3. Lo que no incluye (límites honestos)

- Multi-tenant / white-label para revender a muchos clientes desde una sola base
- App nativa iOS / Android
- Videoconferencia embebida (solo URL externa)
- IA generativa integrada al producto
- i18n (el producto se entrega en español; otros idiomas = proyecto aparte)
- Integraciones ERP / CRM / Moodle / Zoom API fuera de lo listado
- Contenido pedagógico, diseño de cursos ni filmación de clases
- Dominio, casilla de correo corporativa ni cuentas cloud a nombre del proveedor (salvo modalidad servicio, ver §5)

---

## 4. Modalidad A — Producto en manos del cliente

El cliente **adquiere el derecho de uso de la plataforma** en su infraestructura. El código y la instancia quedan bajo su control (cuentas cloud a su nombre).

### 4.1 Qué recibe
- Código fuente de la aplicación
- Esquema de base de datos y migraciones
- Deploy inicial en **sus** cuentas (Vercel o VPS + Supabase)
- Personalización de marca (nombre, colores, logo, textos de contacto, redes)
- Carga inicial: hasta 3 cursos seed o migración asistida de un catálogo acotado
- Manual de usuario por rol + sesión de capacitación (hasta 4 h)
- Período de garantía de bugs: **30 días** post-entrega (defectos de lo entregado, no cambios de alcance)

### 4.2 Paquetes de venta (precio de lista)

| Paquete | Alcance | Precio de lista (USD) | Precio mínimo comercial (USD) |
|---------|---------|----------------------:|-----------------------------:|
| **Base** | Sitio + campus completo **sin** Mercado Pago; email SMTP básico; 1 entorno (prod); capacitación 2 h | **8.500** | **7.200** |
| **Estándar** (recomendado) | Todo lo Base + Mercado Pago + email transaccional configurado + capacitación 4 h + 1 mes de soporte correctivo incluido | **11.500** | **9.800** |
| **Completo** | Todo lo Estándar + import Excel operativo con sus plantillas + 2 sesiones de acompañamiento de cohorte + checklist de go-live | **14.500** | **12.500** |

> **Cómo usar la tabla:** el **precio de lista** es el ancla de propuesta. El **mínimo comercial** es el piso para no vender por debajo del costo de oportunidad. Negociá entre ambos; no cierres bajo el mínimo sin canjear alcance.

### 4.3 Qué NO está en el precio de producto
- Costos recurrentes de infraestructura cloud (los paga el cliente; ver §6)
- Dominio y DNS
- Casillas de correo / dominio verificado para envíos
- Comisiones de Mercado Pago
- Mantenimiento evolutivo después de la garantía (ver §4.5)
- Personalizaciones fuera de marca y de los módulos listados

### 4.4 Plazo de entrega típico
| Paquete | Plazo orientativo desde kickoff |
|---------|----------------------------------|
| Base | 3–4 semanas |
| Estándar | 4–6 semanas |
| Completo | 5–7 semanas |

Depende de demoras del cliente (cuentas cloud, textos, logo, plantillas Excel, cuentas de pago).

### 4.5 Mantenimiento post-entrega (opcional, recomendado)

Contrato anual o mensual **después** de la garantía:

| Plan | Qué cubre | Precio (USD) |
|------|-----------|-------------:|
| **Correctivo** | Bugs, parches de seguridad, ayuda a restaurar backup, hasta 4 h/mes | **180 / mes** o **1.800 / año** |
| **Correctivo + evolutivo liviano** | Lo anterior + hasta 8 h/mes de mejoras menores (textos, campos, reportes chicos, ajustes UX) | **320 / mes** o **3.200 / año** |
| **Bolsa de horas** | Sin retainer; se consume bajo demanda | **55 / h** (bloques de 10 h) |

Regla de mercado: el retainer anual suele ubicarse entre **15 % y 22 %** del precio de lista del paquete vendido. Los planes de arriba ya están calibrados a ese rango para el paquete Estándar.

---

## 5. Modalidad B — Producto vendido como servicio mensual

El proveedor **opera** la plataforma para el cliente. El cliente no administra cloud ni código. Paga un **setup** + **abono mensual**.

### 5.1 Qué incluye el abono
- Hosting de la aplicación y base de datos
- Backups gestionados (según plan del proveedor cloud)
- Actualizaciones de seguridad y correcciones
- Soporte por email / ticket en días hábiles (respuesta en ≤ 1 día hábil)
- Monitoreo básico de disponibilidad
- Hasta el cupo de alumnos activos del plan

### 5.2 Setup (único)

| Concepto | Precio (USD) |
|----------|-------------:|
| Alta de instancia, marca, dominio, roles iniciales, capacitación 2 h | **2.200** |
| Setup + Mercado Pago + plantilla de import Excel del cliente | **2.900** |

### 5.3 Abonos mensuales

| Plan | Alumnos activos / mes | Precio mensuales (USD) | Incluye infra |
|------|----------------------:|-----------------------:|:-------------:|
| **Starter** | hasta 100 | **290** | Sí |
| **Growth** (recomendado) | hasta 500 | **490** | Sí |
| **Scale** | hasta 2.000 | **890** | Sí |
| **Enterprise** | > 2.000 o SLA custom | A cotizar | Sí |

**Alumno activo** = usuario con rol alumno que tiene al menos 1 inscripción vigente o que inició sesión en los últimos 30 días (definir en contrato; usar una sola definición).

### 5.4 Desglose interno del abono (para vos — no hace falta mostrarlo al cliente)

Sobre el plan **Growth (USD 490)**:

| Componente | Costo estimado (USD/mes) | Nota |
|------------|-------------------------:|------|
| Supabase (Pro o equivalente) | 25–35 | Auth + DB + Storage |
| Vercel (Pro) o VPS equivalente | 20–40 | App + cron de email |
| Email transaccional (Resend / SMTP de volumen) | 0–20 | Según volumen |
| Dominio / DNS / misc | ~2 | Prorrateado |
| **Subtotal infra** | **≈ 50–95** | |
| Soporte + operación (tu tiempo) | ≈ 150–220 | Amortizado |
| Margen / riesgo / actualizaciones | resto | |

Margen bruto objetivo del servicio: **≥ 55 %** sobre el abono una vez estabilizado.

### 5.5 Compromiso y salida
- Contrato mínimo recomendado: **6 meses**
- Aviso de baja: **30 días**
- Exportación de datos (CSV / dump acordado) incluida en la baja
- Opción de **migración a modalidad A** (compra del producto): se puede acreditar hasta el **40 %** de lo pagado en abonos de los últimos 12 meses contra el precio de lista del paquete Estándar (tope a acordar por escrito)

---

## 6. Costos de infraestructura (referencia para el cliente o para vos)

Cifras orientativas de mercado cloud (pueden variar; cotizar al día del cierre).

| Ítem | Plan típico | Costo mensuales (USD) | Quién paga |
|------|-------------|----------------------:|------------|
| Hosting app (Vercel Pro o VPS 2–4 GB) | Producción | 20–40 | Cliente (A) / incluido (B) |
| Supabase | Pro | 25–35 | Cliente (A) / incluido (B) |
| Storage extra / ancho de banda video | Según uso | 0–50+ | Quien opera |
| Email (Resend o SMTP verificado) | Starter | 0–20 | Quien opera |
| Dominio .com / .com.ar | Anual | ~1–2 / mes | Cliente |
| Mercado Pago | Comisión por venta | % del ticket | Cliente (comisión del procesador) |
| **Piso operativo típico** | — | **≈ 50–100 / mes** | — |

Videos pesados: conviene que el cliente aloje en YouTube / Vimeo / Drive (la plataforma ya lo soporta). Servir MP4 propios en Storage encarece el plan.

---

## 7. Comparativa rápida para el cliente

| Criterio | Modalidad A — Producto | Modalidad B — Servicio |
|----------|------------------------|-------------------------|
| Inversión inicial | Alta (7.200–14.500 USD) | Baja (2.200–2.900 USD) |
| Costo mensuales | Infra (~50–100) + mantenimiento opcional | Abono fijo según plan |
| Propiedad / control | Alto (código + cuentas propias) | Operado por el proveedor |
| Ideal cuando… | Tiene IT propio o quiere independencia | Quiere “encender y usar” |
| Tiempo hasta go-live | 3–7 semanas | 2–4 semanas |
| Actualizaciones | Por contrato de mantenimiento o bolsa | Incluidas en el abono |

**Regla de bolsillo para el cliente:**  
si proyecta usar la plataforma **más de 24–30 meses** y tiene alguien que administre cloud, la modalidad A suele salir más barata en TCO. Si el horizonte es corto o no hay equipo técnico, conviene B.

---

## 8. Add-ons (fuera de alcance base)

| Add-on | Precio orientativo (USD) |
|--------|-------------------------:|
| Segundo idioma (i18n completo) | 2.500 – 4.500 |
| Diseño visual custom del sitio (más allá de marca) | 1.200 – 3.000 |
| Integración CRM / webhook de leads | 800 – 2.000 |
| Plantilla Excel + automatización de altas a medida | 600 – 1.500 |
| Reportes gerenciales extra / dashboard custom | 900 – 2.500 |
| White-label multi-organización (proyecto aparte) | A cotizar (no es el producto actual) |
| Capacitación adicional (sesión 2 h) | 180 |

---

## 9. Condiciones comerciales sugeridas

1. **Reserva / anticipo modalidad A:** 40 % a la firma · 40 % al deploy en staging · 20 % al go-live.  
2. **Modalidad B:** 100 % del setup a la firma · abono mensuales por adelantado.  
3. **Validez de la cotización:** 30 días.  
4. **Impuestos:** los precios son netos; IVA / retenciones según régimen del proveedor y del cliente.  
5. **Propiedad intelectual (A):** licencia de uso perpetua de la instancia entregada; el proveedor retiene el derecho de reutilizar el *producto genérico* en otros clientes. El cliente no puede revender el código como producto SaaS a terceros sin acuerdo escrito.  
6. **Propiedad intelectual (B):** el cliente es dueño de *sus datos*; el software permanece del proveedor.  
7. **SLA (B):** disponibilidad objetivo 99 % mensuales excluyendo mantenimientos anunciados y fallas de proveedores cloud de terceros.

---

## 10. Cómo cotizar en 5 minutos (guía interna)

1. ¿El cliente quiere **quedarse con el sistema** o **que se lo operen**? → A o B.  
2. ¿Necesita **cobrar cursos online**? → Estándar/Completo o setup +2.900.  
3. ¿Cuántos alumnos en 12 meses? → plan Starter / Growth / Scale.  
4. Anclar siempre al **precio de lista**; bajar solo hasta el **mínimo comercial** a cambio de alcance o plazo.  
5. Sumar siempre la línea de **infra** (A) o confirmar que está **incluida** (B).  
6. Ofrecer mantenimiento Correctivo desde el día 31 en A; no regalar evolución.

### Ejemplo de cierre rápido

**Cliente consultora, ~200 alumnos/año, quiere independencia:**  
→ Modalidad A · Paquete Estándar · **USD 11.500** + infra a su cargo (~USD 70/mes) + Correctivo **USD 180/mes** a partir del mes 2.

**Cliente instituto, sin IT, ~400 alumnos, quiere “listo para usar”:**  
→ Modalidad B · Setup **USD 2.900** + Growth **USD 490/mes** · mínimo 6 meses.

**Cliente grande, 1.500 alumnos, pagos online, import Excel:**  
→ Modalidad A · Completo **USD 14.500** + evolutivo liviano **USD 320/mes**,  
o B · Scale **USD 890/mes** + setup 2.900.

---

## 11. Resumen ejecutivo de precios

| Modalidad | Entrada | Recurrente |
|-----------|--------:|-----------:|
| A · Base | 8.500 (mín. 7.200) | Infra 50–100 + mant. opcional 180–320 |
| A · Estándar | 11.500 (mín. 9.800) | idem |
| A · Completo | 14.500 (mín. 12.500) | idem |
| B · Starter | Setup 2.200–2.900 | 290 / mes |
| B · Growth | Setup 2.200–2.900 | 490 / mes |
| B · Scale | Setup 2.200–2.900 | 890 / mes |

---

*Documento genérico de producto. No identifica a un cliente ni a una marca particular. Ajustar logo, datos fiscales y anexos técnicos al emitir la propuesta formal.*
