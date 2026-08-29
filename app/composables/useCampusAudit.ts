import type { ActivityFilters, ActivityLogEntry } from '~/types/audit'

export function useCampusAudit() {
  const supabase = useSupabaseClient()

  async function fetchActivityLog(filters: ActivityFilters = {}) {
    const limit = filters.limit ?? 100
    let query = supabase
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (filters.action) {
      query = query.eq('action', filters.action)
    }

    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type)
    }

    if (filters.course_id) {
      query = query.eq('course_id', filters.course_id)
    }

    if (filters.days) {
      const since = new Date()
      since.setDate(since.getDate() - filters.days)
      query = query.gte('created_at', since.toISOString())
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as ActivityLogEntry[]
  }

  return {
    fetchActivityLog,
  }
}
