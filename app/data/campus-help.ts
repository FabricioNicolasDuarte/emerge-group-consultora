export type CampusHelpEntry = {
  match: RegExp
  title: string
  summary: string
  steps: string[]
}

/** Manual contextual del panel: primero match gana. */
export const CAMPUS_HELP_GUIDE: CampusHelpEntry[] = [
  {
    match: /^\/campus\/student\/?$/,
    title: 'Inicio del alumno',
    summary: 'Tu punto de partida: continuar el curso, ver el ritmo y atajos a lo importante.',
    steps: [
      'Usá “Continuar / Empezar” para entrar al curso activo.',
      'Revisá el pulse superior si hay mensajes o clases.',
      'Los 4 atajos llevan a cursos, notas, buzón y certificados.',
      'La cola inferior muestra lo que requiere atención hoy.',
    ],
  },
  {
    match: /^\/campus\/student\/cursos/,
    title: 'Mis cursos',
    summary: 'Listado de programas en los que estás inscripto.',
    steps: [
      'Abrí un curso para ver módulos y lecciones.',
      'El porcentaje indica tu avance registrado.',
      'Si no ves un programa, pedile a administración que revise tu inscripción.',
    ],
  },
  {
    match: /^\/campus\/student\/asistencia/,
    title: 'Asistencia',
    summary: 'Resumen de tu presencia en clases y sesiones registradas.',
    steps: [
      'Consultá el porcentaje por curso.',
      'Si falta una marca, contactá a tu docente o a administración.',
    ],
  },
  {
    match: /^\/campus\/student\/notas/,
    title: 'Mis notas',
    summary: 'Evaluaciones y promedios publicados por tus docentes.',
    steps: [
      'Revisá cada evaluación y el promedio del curso.',
      'Las notas aparecen cuando el docente las publica.',
    ],
  },
  {
    match: /^\/campus\/student\/progreso/,
    title: 'Mi progreso',
    summary: 'Vista detallada de avance en tus programas.',
    steps: [
      'Compará el avance entre cursos.',
      'Volvé al curso para retomar donde lo dejaste.',
    ],
  },
  {
    match: /^\/campus\/student\/certificados/,
    title: 'Certificados',
    summary: 'Certificados emitidos al completar un programa.',
    steps: [
      'Descargá o abrí el certificado cuando esté disponible.',
      'Si completaste el curso y no aparece, avisá a administración.',
    ],
  },
  {
    match: /^\/campus\/student\/comunicaciones|^\/campus\/teacher\/comunicaciones|^\/campus\/admin\/comunicaciones/,
    title: 'Comunicaciones',
    summary: 'Hub de avisos, alertas y acceso al buzón.',
    steps: [
      'Revisá anuncios recientes.',
      'Entrá al buzón para mensajes directos.',
    ],
  },
  {
    match: /^\/campus\/buzon/,
    title: 'Buzón',
    summary: 'Mensajería interna del Campus entre alumnos, docentes y administración.',
    steps: [
      'Abrí un hilo para leer y responder.',
      'Usá “Redactar” para un mensaje nuevo (si tu rol lo permite).',
      'Los mensajes “vía email” llegan también desde Gmail cuando alguien responde por correo.',
    ],
  },
  {
    match: /^\/campus\/anuncios/,
    title: 'Anuncios',
    summary: 'Novedades publicadas para tu rol o para todo el Campus.',
    steps: [
      'Abrí un anuncio para leer el detalle completo.',
      'Los no leídos también aparecen en el aviso superior.',
    ],
  },
  {
    match: /^\/campus\/perfil/,
    title: 'Mi perfil',
    summary: 'Datos personales, foto y cambio de contraseña.',
    steps: [
      'Actualizá nombre y datos de contacto.',
      'Podés subir o quitar tu foto de perfil.',
      'Cambiá la contraseña desde acá cuando quieras.',
    ],
  },
  {
    match: /^\/campus\/teacher\/?$/,
    title: 'Inicio docente',
    summary: 'Panorama de tus cursos, alumnos y próximas clases.',
    steps: [
      'Revisá inscriptos por curso.',
      'Entrá a “Mis cursos” para gestionar contenido, asistencia y notas.',
      'Usá el buzón para mensajes con alumnos.',
    ],
  },
  {
    match: /^\/campus\/teacher\/cursos/,
    title: 'Cursos del docente',
    summary: 'Programas donde tenés rol docente o tutor.',
    steps: [
      'Abrí el hub del curso para contenido, alumnos, asistencia y calificaciones.',
      'Publicá avisos del curso desde comunicaciones/anuncios según tu permiso.',
    ],
  },
  {
    match: /^\/campus\/admin\/?$/,
    title: 'Inicio administración',
    summary: 'Salud general del Campus: cursos, alumnos e inscripciones.',
    steps: [
      'Creá cursos o inscripciones desde las acciones rápidas.',
      'Usá Reportes para análisis más amplio.',
      'Importá cohortes desde Solicitudes si trabajás con Excel.',
    ],
  },
  {
    match: /^\/campus\/admin\/cursos/,
    title: 'Gestión de cursos',
    summary: 'Alta, edición y operación de programas formativos.',
    steps: [
      'Entrá al hub de un curso para contenido, alumnos, asistencia y notas.',
      'Publicá el curso cuando el contenido esté listo.',
    ],
  },
  {
    match: /^\/campus\/admin\/alumnos/,
    title: 'Alumnos',
    summary: 'Usuarios con rol alumno y su estado en el Campus.',
    steps: [
      'Creá o editá alumnos.',
      'Para altas masivas usá Solicitudes / importar Excel.',
    ],
  },
  {
    match: /^\/campus\/admin\/docentes/,
    title: 'Docentes',
    summary: 'Usuarios con rol docente o tutor.',
    steps: [
      'Alta o promoción de docentes.',
      'Asignalos a cursos desde la gestión del curso.',
    ],
  },
  {
    match: /^\/campus\/admin\/inscripciones/,
    title: 'Inscripciones',
    summary: 'Vínculo entre alumnos y cursos.',
    steps: [
      'Creá inscripciones activas para habilitar el acceso al contenido.',
      'Revisá altas recientes en el listado.',
    ],
  },
  {
    match: /^\/campus\/admin\/solicitudes/,
    title: 'Solicitudes / importación',
    summary: 'Carga masiva de alumnos desde Excel y conversión a cuentas.',
    steps: [
      'Importá el archivo.',
      'Convertí los listos a usuarios y descargá credenciales.',
    ],
  },
  {
    match: /^\/campus\/admin\/anuncios/,
    title: 'Anuncios (admin)',
    summary: 'Publicación de novedades para el Campus.',
    steps: [
      'Creá un anuncio nuevo.',
      'Definí audiencia y publicá cuando esté listo.',
    ],
  },
  {
    match: /^\/campus\/admin\/reportes/,
    title: 'Reportes',
    summary: 'Indicadores agregados del Campus.',
    steps: [
      'Explorá métricas de cursos e inscripciones.',
      'Usá los datos para seguimiento operativo (sin inventar KPIs).',
    ],
  },
  {
    match: /^\/campus\/admin\/auditoria/,
    title: 'Auditoría',
    summary: 'Registro de acciones sensibles (solo superadmin).',
    steps: [
      'Revisá eventos recientes del sistema.',
      'Filtrá por tipo de acción si necesitás investigar un caso.',
    ],
  },
  {
    match: /^\/campus\/cursos\//,
    title: 'Curso / lección',
    summary: 'Contenido del programa: módulos, lecciones y materiales.',
    steps: [
      'Avanzá por las lecciones en orden.',
      'Marcá el progreso al completar actividades cuando corresponda.',
      'Volvé al panel con el logo o el menú lateral.',
    ],
  },
]

export const CAMPUS_HELP_FALLBACK = {
  title: 'Campus Emerge',
  summary: 'Estás en el panel del Campus. Usá el menú lateral para navegar entre secciones según tu rol.',
  steps: [
    'El inicio resume lo más importante del día.',
    'El buzón concentra mensajes internos.',
    'Si necesitás ayuda, abrí Soporte técnico desde el pie.',
  ],
} as const

export function resolveCampusHelp(path: string) {
  const normalized = path.replace(/\/$/, '') || '/'
  const found = CAMPUS_HELP_GUIDE.find((entry) => entry.match.test(normalized))
  return found
    ? { title: found.title, summary: found.summary, steps: [...found.steps] }
    : { ...CAMPUS_HELP_FALLBACK, steps: [...CAMPUS_HELP_FALLBACK.steps] }
}
