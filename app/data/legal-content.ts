/** Contenido institucional / legal del Campus y sitio. */

export const LEGAL_UPDATED = '28 de septiembre de 2026'

export const INSTITUTIONAL_NAV = [
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/faq', label: 'Preguntas frecuentes' },
  { to: '/privacidad', label: 'Privacidad' },
  { to: '/terminos', label: 'Términos' },
  { to: '/cookies', label: 'Cookies' },
] as const

export const ABOUT_PAGE = {
  eyebrow: 'Quiénes somos',
  title: 'Emerge Group Consultora',
  lead:
    'Acompañamos procesos que transforman personas, equipos y organizaciones. Integramos estrategia, coaching ontológico y formación para generar cambios sostenibles.',
  sections: [
    {
      title: 'Nuestra mirada',
      body:
        'Trabajamos con una perspectiva sistémica: personas, equipos y cultura. El Campus Emerge es el espacio digital donde esa formación se organiza, se mide y se acompaña.',
    },
    {
      title: 'Campus Emerge',
      body:
        'Es la plataforma de aprendizaje de Emerge Group: cursos, clases en vivo, comunicaciones, progreso y certificaciones en un solo lugar, para alumnos, docentes y administración.',
    },
    {
      title: 'Dónde operamos',
      body:
        'Operamos desde Argentina, con alcance a organizaciones educativas, empresas e instituciones. El contacto oficial aparece en el pie de página del sitio.',
    },
  ],
} as const

export const FAQ_ITEMS = [
  {
    q: '¿Cómo ingreso al Campus?',
    a: 'Entrá a /campus/login con el correo y la contraseña que te asignó la administración. Si olvidaste la clave, usá “Olvidé mi contraseña”.',
  },
  {
    q: 'No veo mis cursos o el contenido',
    a: 'Verificá que tengas inscripción activa, que el curso esté publicado y que hayas iniciado sesión con la cuenta correcta. Si el problema continúa, contactá a administración por WhatsApp o correo.',
  },
  {
    q: '¿Cómo recupero mi contraseña?',
    a: 'Desde el login, pedí un enlace de recuperación. Te llega un correo con un link para definir una nueva clave. Podés solicitarlo las veces que necesites.',
  },
  {
    q: '¿Dónde están mis certificados?',
    a: 'En el panel de alumno, sección Certificados. Solo aparecen cuando la administración los emite al completar un programa.',
  },
  {
    q: '¿Cómo me comunico con docentes o administración?',
    a: 'Usá el buzón interno del Campus y los anuncios. También podés escribir al correo o WhatsApp institucionales del pie de página.',
  },
  {
    q: '¿Los pagos se hacen dentro del Campus?',
    a: 'Cuando hay cobro online habilitado, el proceso se inicia desde la ficha del curso (Mercado Pago). Si no está configurado, la inscripción la gestiona administración.',
  },
  {
    q: '¿Quién ve mis datos?',
    a: 'El personal autorizado de Emerge Group (administración y roles docentes según corresponda). Detalle completo en la Política de privacidad.',
  },
] as const

export const PRIVACY_SECTIONS = [
  {
    title: 'Responsable',
    body:
      'Emerge Group Consultora (“nosotros”) opera el sitio y el Campus Emerge. Para ejercer derechos o consultas de privacidad, usá el correo o WhatsApp publicados en el pie de página.',
  },
  {
    title: 'Datos que tratamos',
    body:
      'Datos de cuenta (nombre, correo, rol), perfil opcional (teléfono, ciudad, ocupación), actividad académica (inscripciones, progreso, asistencia, calificaciones), mensajes del buzón y datos técnicos de sesión (cookies necesarias, dirección IP aproximada en logs de seguridad).',
  },
  {
    title: 'Finalidad',
    body:
      'Prestar el servicio de formación, gestionar usuarios y cursos, comunicar novedades del Campus, emitir certificados, mejorar la seguridad de la plataforma y cumplir obligaciones legales aplicables.',
  },
  {
    title: 'Base y conservación',
    body:
      'Tratamos datos para ejecutar la relación formativa/contractual y el interés legítimo de operar el Campus de forma segura. Conservamos la información mientras la cuenta esté activa y el tiempo adicional que exijan políticas internas o la ley.',
  },
  {
    title: 'Encargados y terceros',
    body:
      'Usamos proveedores de infraestructura (hosting, autenticación, correo) bajo acuerdos de tratamiento. Si hay pagos online, el procesador (p. ej. Mercado Pago) trata datos de cobro según sus propias políticas.',
  },
  {
    title: 'Tus derechos',
    body:
      'Podés solicitar acceso, actualización, rectificación o baja de tu cuenta, y oponerte a tratamientos no esenciales. Respondemos por los canales de contacto institucionales.',
  },
  {
    title: 'Seguridad',
    body:
      'Aplicamos controles técnicos y organizativos razonables (acceso por roles, cifrado en tránsito, claves de servicio solo en servidor). Ningún sistema es 100 % invulnerable; te pedimos cuidar tu contraseña.',
  },
] as const

export const TERMS_SECTIONS = [
  {
    title: 'Aceptación',
    body:
      'Al usar el sitio o el Campus Emerge aceptás estos términos. Si no estás de acuerdo, no uses la plataforma.',
  },
  {
    title: 'Servicio',
    body:
      'El Campus ofrece acceso a programas de formación, materiales, evaluaciones, comunicaciones y certificaciones según el rol asignado (alumno, docente, administración). El alcance concreto depende de la inscripción y de lo publicado por Emerge Group.',
  },
  {
    title: 'Cuentas',
    body:
      'Sos responsable de la confidencialidad de tu acceso. No compartas credenciales. La administración puede desactivar cuentas ante uso indebido, fraude o incumplimiento.',
  },
  {
    title: 'Contenidos y propiedad intelectual',
    body:
      'Los materiales del Campus (textos, videos, documentos, marcas) pertenecen a Emerge Group o a terceros licenciantes. Queda prohibida la reproducción o redistribución no autorizada fuera de la plataforma.',
  },
  {
    title: 'Conducta',
    body:
      'Debés usar el Campus de forma respetuosa. No está permitido hostigar, publicar contenido ilegal, intentar vulnerar la seguridad ni suplantar identidades.',
  },
  {
    title: 'Disponibilidad',
    body:
      'Nos esforzamos por mantener el servicio disponible, pero puede haber mantenimientos, interrupciones de terceros o fuerza mayor. No garantizamos disponibilidad ininterrumpida.',
  },
  {
    title: 'Limitación',
    body:
      'En la medida permitida por la ley argentina aplicable, Emerge Group no responde por daños indirectos derivados del uso o la imposibilidad de uso del Campus, salvo dolo o culpa grave.',
  },
  {
    title: 'Cambios',
    body:
      'Podemos actualizar estos términos. La fecha de actualización figura al inicio de la página. El uso continuado implica aceptación de la versión vigente.',
  },
  {
    title: 'Ley aplicable',
    body:
      'Estos términos se rigen por las leyes de la República Argentina. Para controversias, los tribunales competentes serán los que correspondan según la normativa vigente y el domicilio de la parte actora cuando la ley lo permita.',
  },
] as const

export const COOKIES_SECTIONS = [
  {
    title: 'Qué son',
    body:
      'Las cookies y tecnologías similares son pequeños archivos o datos que el navegador guarda para recordar preferencias, mantener la sesión y asegurar el servicio.',
  },
  {
    title: 'Cookies que usamos',
    body:
      'Esenciales de autenticación y sesión (Supabase / Campus), preferencias de interfaz (p. ej. sidebar colapsado) y, si aplica, medición técnica básica del hosting. No usamos publicidad de terceros en el panel del Campus.',
  },
  {
    title: 'Gestión',
    body:
      'Podés borrar o bloquear cookies desde tu navegador. Si deshabilitás las esenciales, es posible que no puedas iniciar sesión o usar el Campus.',
  },
] as const
