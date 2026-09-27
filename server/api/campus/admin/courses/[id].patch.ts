import { requireCampusSuperadmin } from '../../../../utils/campus-admin'
import { slugify } from '~/utils/slugify'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const { admin } = await requireCampusSuperadmin(event)
  const id = getRouterParam(event, 'id')
  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Id de curso inválido' })
  }

  const body = await readBody<{
    title?: string
    category?: string
    description?: string
    status?: 'draft' | 'published' | 'archived'
    price_amount?: number
    cohort_start_date?: string | null
    cohort_end_date?: string | null
    enrollment_cap?: number | null
    enrollment_starts_at?: string | null
    enrollment_ends_at?: string | null
  }>(event)

  const title = String(body?.title ?? '').trim()
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'El título es obligatorio' })
  }

  const payload = {
    title,
    slug: slugify(title),
    category: String(body?.category ?? 'General').trim() || 'General',
    description: String(body?.description ?? '').trim(),
    status: body?.status === 'published' || body?.status === 'archived' ? body.status : 'draft',
    price_amount: typeof body?.price_amount === 'number' ? body.price_amount : 0,
    cohort_start_date: body?.cohort_start_date || null,
    cohort_end_date: body?.cohort_end_date || null,
    enrollment_cap: body?.enrollment_cap ?? null,
    enrollment_starts_at: body?.enrollment_starts_at || null,
    enrollment_ends_at: body?.enrollment_ends_at || null,
  }

  const { data, error } = await admin
    .from('courses')
    .update(payload)
    .eq('id', id)
    .select('id, title, slug, status')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Curso no encontrado' })
  }

  return data
})
