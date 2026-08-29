export const SITE_HERO_VIDEO = '/hero-consultora.mp4'
export const SITE_HERO_POSTER = '/hero-bg.jpg'

export const SITE_NAV = [
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'organizaciones', label: 'Organizaciones' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'metodologia', label: 'Metodología' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'contacto', label: 'Contacto' },
] as const

export const SITE_TRUST = [
  { title: 'Consultoría integral', text: 'Estrategia, liderazgo y desarrollo humano' },
  { title: 'Procesos a medida', text: 'Diseñados según cada organización' },
  { title: 'Mirada sistémica', text: 'Personas, equipos y cultura organizacional' },
] as const

export const SITE_ORGANIZATIONS = [
  {
    id: 'empresas',
    label: 'Empresas',
    title: 'Empresas y equipos de trabajo',
    text: 'Acompañamos procesos de cambio, liderazgo y comunicación para ordenar prioridades, fortalecer acuerdos y mejorar resultados.',
    highlights: ['Clima laboral y liderazgo', 'Gestión de conflictos', 'Planes de acción concretos'],
  },
  {
    id: 'educacion',
    label: 'Educación',
    title: 'Instituciones educativas',
    text: 'Propuestas para docentes, equipos directivos y estudiantes en liderazgo, bienestar, comunicación y aprendizaje colaborativo.',
    highlights: ['Formación docente', 'Liderazgo educativo', 'Dinámicas para estudiantes'],
  },
  {
    id: 'institucional',
    label: 'Institucional',
    title: 'Ámbito público e institucional',
    text: 'Consultoría en comunicación estratégica, posicionamiento, protocolo y acompañamiento en escenarios de alta visibilidad.',
    highlights: ['Comunicación política', 'Ceremonial y protocolo', 'Oratoria y presencia'],
  },
  {
    id: 'profesionales',
    label: 'Profesionales',
    title: 'Líderes y profesionales',
    text: 'Coaching ejecutivo y procesos individuales para quienes buscan claridad, nuevas conversaciones y crecimiento sostenible.',
    highlights: ['Coaching ejecutivo', 'Toma de decisiones', 'Desarrollo personal'],
  },
] as const

export const SITE_PILLARS = [
  {
    image: '/estrategia.jpg',
    title: 'Mirada estratégica',
    text: 'Analizamos cada organización en su contexto real para diseñar intervenciones alineadas a sus objetivos.',
  },
  {
    image: '/conversaciones.jpg',
    title: 'Conversaciones que transforman',
    text: 'Trabajamos sobre la comunicación, los vínculos y las decisiones que impactan en los resultados.',
  },
  {
    image: '/resultados.jpg',
    title: 'Resultados sostenibles',
    text: 'Acompañamos procesos que no solo generan cambios, sino que los sostienen en el tiempo.',
  },
] as const

export const SITE_SERVICE_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'organizacional', label: 'Organizacional' },
  { id: 'liderazgo', label: 'Liderazgo' },
  { id: 'institucional', label: 'Institucional' },
  { id: 'educativo', label: 'Educativo' },
] as const

export type SiteServiceCategory = Exclude<(typeof SITE_SERVICE_CATEGORIES)[number]['id'], 'all'>

export const SITE_SERVICES = [
  {
    category: 'organizacional' as const,
    title: 'Coaching organizacional',
    text: 'Procesos de cambio, liderazgo, comunicación y mejora del clima laboral.',
  },
  {
    category: 'liderazgo' as const,
    title: 'Coaching ejecutivo y de equipos',
    text: 'Fortalecimiento de conversaciones, acuerdos, decisiones y desempeño colectivo.',
  },
  {
    category: 'liderazgo' as const,
    title: 'Capacitación y training',
    text: 'Talleres sobre liderazgo, comunicación, gestión emocional y habilidades blandas.',
  },
  {
    category: 'organizacional' as const,
    title: 'Gestión de conflictos',
    text: 'Facilitación de conversaciones difíciles para transformar tensiones en acuerdos.',
  },
  {
    category: 'organizacional' as const,
    title: 'Consultoría estratégica',
    text: 'Orden de prioridades, definición de objetivos y planes de acción sostenibles.',
  },
  {
    category: 'educativo' as const,
    title: 'Coaching educativo',
    text: 'Propuestas para docentes y estudiantes en liderazgo, bienestar y aprendizaje.',
  },
  {
    category: 'institucional' as const,
    title: 'Coaching político e institucional',
    text: 'Comunicación, posicionamiento y construcción de mensajes en escenarios públicos.',
  },
  {
    category: 'institucional' as const,
    title: 'Ceremonial, protocolo y oratoria',
    text: 'Imagen institucional, comunicación estratégica y presencia profesional.',
  },
] as const

export const SITE_METHOD = [
  { step: '01', title: 'Diagnóstico', text: 'Escuchamos, relevamos necesidades y comprendemos el contexto real.' },
  { step: '02', title: 'Diseño', text: 'Construimos una propuesta personalizada según objetivos y cultura.' },
  { step: '03', title: 'Implementación', text: 'Facilitamos talleres, encuentros y procesos de acompañamiento.' },
  { step: '04', title: 'Seguimiento', text: 'Evaluamos avances, ajustamos acciones y sostenemos el proceso.' },
] as const

export const SITE_TEAM = [
  {
    image: '/equipo-teresa.jpg',
    name: 'María Teresa Zamboni',
    role: 'Coach Ontológico · Programadora · Docente',
    bio: 'Integra educación, tecnología y desarrollo humano para acompañar procesos de aprendizaje, liderazgo y transformación.',
    tags: ['Educación', 'Tecnología', 'Coaching'],
  },
  {
    image: '/equipo-fabio.jpg',
    name: 'Fabio Rodolfo Martinez',
    role: 'Senior Coach Ontológico · Mediador',
    bio: 'Especialista en liderazgo, comunicación política y acompañamiento de procesos estratégicos institucionales.',
    tags: ['Liderazgo', 'Mediación', 'Estrategia'],
  },
  {
    image: '/equipo-mariana.jpg',
    name: 'Mariana Edith Bedoya',
    role: 'Senior Coach · Ceremonial y Protocolo',
    bio: 'Especialista en imagen institucional, protocolo y comunicación estratégica en espacios de representación.',
    tags: ['Protocolo', 'Comunicación', 'Institucional'],
  },
] as const

export const SITE_TESTIMONIALS = [
  {
    quote: 'El proceso nos permitió ordenar conversaciones pendientes, fortalecer acuerdos y mirar al equipo desde nuevas posibilidades.',
    author: 'Equipo de trabajo',
    context: 'Proceso organizacional',
  },
  {
    quote: 'Encontramos claridad para definir prioridades, mejorar la comunicación interna y avanzar con mayor compromiso.',
    author: 'Institución educativa',
    context: 'Capacitación y acompañamiento',
  },
  {
    quote: 'La intervención nos ayudó a transformar tensiones en conversaciones productivas y construir acuerdos concretos.',
    author: 'Organización cliente',
    context: 'Gestión de conflictos',
  },
] as const

export const SITE_CONTACT = [
  {
    id: 'asesoramiento',
    label: 'Asesoramiento',
    description: 'Consultas generales, diagnóstico inicial y orientación sobre el tipo de proceso que necesitás.',
    type: 'whatsapp' as const,
    cta: 'Escribir por WhatsApp',
    whatsappTopic: 'asesoramiento',
  },
  {
    id: 'capacitacion',
    label: 'Capacitación',
    description: 'Talleres, formaciones y propuestas de training para equipos, docentes y organizaciones.',
    type: 'whatsapp' as const,
    cta: 'Consultar capacitación',
    whatsapp: '5493704577491',
    whatsappTopic: 'capacitación',
  },
  {
    id: 'consultoria',
    label: 'Consultoría',
    description: 'Proyectos de consultoría estratégica, acompañamiento organizacional y procesos a medida.',
    type: 'whatsapp' as const,
    cta: 'Iniciar consultoría',
    whatsapp: '5493704326924',
    whatsappTopic: 'consultoría',
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Escribinos con tu consulta y te respondemos a la brevedad con la información que necesitás.',
    type: 'email' as const,
    cta: 'Enviar email',
  },
] as const
