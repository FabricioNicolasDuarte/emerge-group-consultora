/** Rutas de gestión docente bajo /campus/teacher. */

export const TEACHER_STAFF_ROUTE_PATTERNS = [

  /^\/campus\/teacher\/anuncios(\/|$)/,

  /^\/campus\/teacher\/comunicaciones(\/|$)/,

  /^\/campus\/teacher\/cursos\/[^/]+(\/(contenido|alumnos|asistencia|calificaciones))?(\/|$)/,

] as const

export const STUDENT_COMMS_ROUTE_PATTERNS = [
  /^\/campus\/student\/comunicaciones(\/|$)/,
] as const

/** Rutas compartidas donde se mantiene el panel activo al navegar. */

export const PANEL_PRESERVED_ROUTES = [

  /^\/campus\/buzon(\/|$)/,

  /^\/campus\/cursos(\/|$)/,

  /^\/campus\/pagos(\/|$)/,

  /^\/campus\/anuncios(\/|$)/,

  ...STUDENT_COMMS_ROUTE_PATTERNS,

  ...TEACHER_STAFF_ROUTE_PATTERNS,

] as const



export function isPanelPreservedRoute(path: string) {

  return PANEL_PRESERVED_ROUTES.some((pattern) => pattern.test(path))

}



/** Punto de entrada post-login (redirige al panel según rol). */

export const CAMPUS_ENTRY_PATH = '/campus/dashboard'



export const CAMPUS_PUBLIC_ROUTES = new Set([

  '/campus',

  '/campus/login',

  '/campus/registro',

  '/campus/restablecer-contrasena',

  CAMPUS_ENTRY_PATH,

  '/campus/panel',

])



export const CAMPUS_GUEST_PREFIXES = [

  '/campus/cursos',

  '/campus/anuncios',

] as const



export function isPublicCertificateRoute(path: string) {

  return /^\/campus\/certificados\/[^/]+$/.test(path)

}



export function isCampusGuestRoute(path: string) {

  const normalized = path.replace(/\/$/, '') || '/'

  if (CAMPUS_PUBLIC_ROUTES.has(normalized)) return true

  if (isPublicCertificateRoute(normalized)) return true

  return CAMPUS_GUEST_PREFIXES.some(

    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),

  )

}

/** Catálogo y reproductor de curso: layout propio sin panel lateral. */

export function isCampusCourseRoute(path: string) {

  const normalized = path.replace(/\/$/, '') || '/'

  return normalized === '/campus/cursos' || normalized.startsWith('/campus/cursos/')

}

/** Páginas con layout: false (anuncios públicos, pagos, certificados). */

export function isCampusStandaloneLayoutRoute(path: string) {

  const normalized = path.replace(/\/$/, '') || '/'

  if (isPublicCertificateRoute(normalized)) return true

  return normalized === '/campus/anuncios'

    || normalized.startsWith('/campus/anuncios/')

    || normalized === '/campus/pagos'

    || normalized.startsWith('/campus/pagos/')

}


