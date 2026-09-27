import { requireCampusSuperadmin } from '../../../../utils/campus-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const { admin, caller } = await requireCampusSuperadmin(event)
  const id = getRouterParam(event, 'id')
  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Id de usuario inválido' })
  }

  if (id === caller.id) {
    throw createError({ statusCode: 400, statusMessage: 'No podés eliminar tu propia cuenta' })
  }

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true, id }
})
