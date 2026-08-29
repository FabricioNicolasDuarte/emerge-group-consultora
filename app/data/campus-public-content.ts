export const CAMPUS_PUBLIC_HERO_VIDEO = '/hero-consultora.mp4'
export const CAMPUS_PUBLIC_HERO_POSTER = '/hero-bg.jpg'

export const CAMPUS_PUBLIC_NAV = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'programas', label: 'Programas' },
  { id: 'sobre-campus', label: 'Sobre el Campus' },
  { id: 'quien-forma', label: 'Equipo' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'para-quien', label: 'Para quién' },
] as const

export const CAMPUS_PUBLIC_TRUST = [
  { title: 'Formación aplicada', text: 'Contenidos orientados a la práctica profesional' },
  { title: 'Acompañamiento', text: 'Seguimiento y espacios de reflexión' },
  { title: 'Certificación', text: 'Validación al completar cada programa' },
] as const

export const CAMPUS_PUBLIC_PILLARS = [
  {
    step: '01',
    title: 'Formación aplicada',
    text: 'Propuestas diseñadas para llevar el aprendizaje a situaciones concretas del ámbito profesional y organizacional.',
  },
  {
    step: '02',
    title: 'Desarrollo humano',
    text: 'Integramos liderazgo, comunicación, emociones y transformación personal como parte del aprendizaje.',
  },
  {
    step: '03',
    title: 'Innovación',
    text: 'Incorporamos herramientas y metodologías actuales para responder a los desafíos del presente.',
  },
] as const

export const CAMPUS_PUBLIC_JOURNEY = [
  { step: '01', title: 'Explorá', text: 'Conocé los programas disponibles y elegí el que mejor se adapte a tus objetivos.' },
  { step: '02', title: 'Inscribite', text: 'Creá tu cuenta, completá la inscripción y accedé al campus virtual.' },
  { step: '03', title: 'Aprendé', text: 'Avanzá por módulos, actividades y recursos con seguimiento progresivo.' },
  { step: '04', title: 'Certificá', text: 'Al finalizar, obtené tu certificación y consolidá lo aprendido.' },
] as const

export const CAMPUS_PUBLIC_AUDIENCE = [
  {
    id: 'profesionales',
    label: 'Profesionales',
    title: 'Profesionales en crecimiento',
    text: 'Para quienes buscan fortalecer competencias, ampliar perspectivas y prepararse para nuevos desafíos laborales.',
    highlights: ['Desarrollo de habilidades', 'Liderazgo personal', 'Actualización continua'],
  },
  {
    id: 'equipos',
    label: 'Equipos',
    title: 'Líderes y equipos de trabajo',
    text: 'Equipos que quieren mejorar comunicación, coordinación y capacidad de generar resultados colectivos.',
    highlights: ['Comunicación efectiva', 'Trabajo colaborativo', 'Liderazgo compartido'],
  },
  {
    id: 'organizaciones',
    label: 'Organizaciones',
    title: 'Empresas e instituciones',
    text: 'Organizaciones que necesitan procesos de formación adaptados a sus objetivos y realidad institucional.',
    highlights: ['Formación a medida', 'Capacitación in-company', 'Desarrollo organizacional'],
  },
  {
    id: 'educadores',
    label: 'Educadores',
    title: 'Docentes y educadores',
    text: 'Profesionales de la educación interesados en liderazgo, bienestar, comunicación e innovación educativa.',
    highlights: ['Liderazgo educativo', 'Bienestar docente', 'Metodologías activas'],
  },
] as const
