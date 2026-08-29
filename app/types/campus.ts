export type CampusRoleSlug =
  | 'superadmin'
  | 'admin'
  | 'coordinador'
  | 'docente'
  | 'tutor'
  | 'alumno'

export interface CampusProfile {
  id: string
  email: string | null
  full_name: string
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  role_slugs: CampusRoleSlug[]
  role_names: string[]
}

export const ROLE_HIERARCHY: Record<CampusRoleSlug, number> = {
  superadmin: 100,
  admin: 80,
  coordinador: 60,
  docente: 40,
  tutor: 30,
  alumno: 10,
}

export const ROLE_DASHBOARD_PATHS: Record<CampusRoleSlug, string> = {
  superadmin: '/campus/admin',
  admin: '/campus/admin',
  coordinador: '/campus/admin',
  docente: '/campus/teacher',
  tutor: '/campus/teacher',
  alumno: '/campus/student',
}
