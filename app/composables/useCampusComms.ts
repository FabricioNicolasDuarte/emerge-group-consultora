import type {
  AdminAnnouncement,
  AnnouncementMedia,
  AnnouncementStatus,
  CampusAnnouncement,
  CreateAnnouncementInput,
  CreateNotificationInput,
  PublicAnnouncement,
  UpdateAnnouncementInput,
} from '~/types/comms'
import { stripHtml } from '~/utils/sanitize-html'

export function useCampusComms() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  function getAnnouncementMediaUrl(storagePath: string) {
    const { data } = supabase.storage.from('announcement-media').getPublicUrl(storagePath)
    return data.publicUrl
  }

  async function fetchPublicAnnouncements() {
    const { data, error } = await supabase.from('public_announcements').select('*')
    if (error) throw error
    return (data ?? []) as PublicAnnouncement[]
  }

  async function fetchCampusAnnouncements() {
    const { data, error } = await supabase.from('campus_announcements').select('*')
    if (error) throw error
    return (data ?? []) as CampusAnnouncement[]
  }

  async function fetchAdminAnnouncements() {
    const { data, error } = await supabase.from('admin_announcements').select('*')
    if (error) throw error
    return (data ?? []) as AdminAnnouncement[]
  }

  async function fetchAnnouncementById(id: string) {
    const { data, error } = await supabase
      .from('admin_announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as AdminAnnouncement | null
  }

  async function fetchPublicAnnouncementById(id: string) {
    const { data, error } = await supabase
      .from('public_announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (data) return data as PublicAnnouncement
    const { data: campusData, error: campusError } = await supabase
      .from('campus_announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (campusError) throw campusError
    return campusData as CampusAnnouncement | null
  }

  async function fetchMyNotifications() {
    const { data, error } = await supabase.from('my_notifications').select('*')
    if (error) throw error
    return (data ?? []) as import('~/types/comms').CampusNotification[]
  }

  async function fetchUnreadCount() {
    const { data, error } = await supabase.from('my_unread_notifications').select('unread_count').maybeSingle()
    if (error) throw error
    return data?.unread_count ?? 0
  }

  function buildAnnouncementPayload(input: CreateAnnouncementInput) {
    const bodyHtml = input.body_html ?? ''
    const plainBody = input.body ?? stripHtml(bodyHtml)
    const excerpt = input.excerpt ?? stripHtml(bodyHtml).slice(0, 280)
    return {
      title: input.title.trim(),
      body: plainBody,
      body_html: bodyHtml,
      design_json: input.design_json ?? null,
      excerpt,
      background_color: input.background_color ?? '#ffffff',
      accent_color: input.accent_color ?? '#0D2C54',
      cover_image_path: input.cover_image_path ?? null,
      layout_style: input.layout_style ?? 'card',
      audience: input.audience ?? 'all',
      course_id: input.audience === 'course' ? input.course_id ?? null : null,
      status: input.status ?? 'draft',
      is_pinned: input.is_pinned ?? false,
      expires_at: input.expires_at || null,
      created_by: user.value?.id ?? null,
    }
  }

  async function createAnnouncement(input: CreateAnnouncementInput) {
    const { data, error } = await supabase
      .from('announcements')
      .insert(buildAnnouncementPayload(input))
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function updateAnnouncement(input: UpdateAnnouncementInput) {
    const { id, ...rest } = input
    const payload = buildAnnouncementPayload(rest)
    const { data, error } = await supabase
      .from('announcements')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function updateAnnouncementStatus(announcementId: string, status: AnnouncementStatus) {
    const patch: { status: AnnouncementStatus, published_at?: string } = { status }
    if (status === 'published') {
      patch.published_at = new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('announcements')
      .update(patch)
      .eq('id', announcementId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function deleteAnnouncement(announcementId: string) {
    const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
    if (error) throw error
  }

  async function uploadAnnouncementMedia(announcementId: string, file: File, mediaType: 'image' | 'video' | 'file') {
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${announcementId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('announcement-media')
      .upload(path, file, { upsert: false, contentType: file.type })
    if (uploadError) throw uploadError

    const publicUrl = getAnnouncementMediaUrl(path)
    const { data: mediaRows } = await supabase
      .from('announcement_media')
      .select('sort_order')
      .eq('announcement_id', announcementId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const sortOrder = (mediaRows?.[0]?.sort_order ?? 0) + 1
    const { data, error } = await supabase
      .from('announcement_media')
      .insert({
        announcement_id: announcementId,
        media_type: mediaType,
        storage_path: path,
        public_url: publicUrl,
        title: file.name,
        mime_type: file.type,
        sort_order: sortOrder,
      })
      .select()
      .single()
    if (error) throw error
    return data as AnnouncementMedia
  }

  async function deleteAnnouncementMedia(mediaId: string, storagePath: string) {
    await supabase.storage.from('announcement-media').remove([storagePath])
    const { error } = await supabase.from('announcement_media').delete().eq('id', mediaId)
    if (error) throw error
  }

  async function sendNotification(input: CreateNotificationInput) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.user_id,
        title: input.title.trim(),
        body: input.body?.trim() ?? '',
        notification_type: input.notification_type ?? 'info',
        link_url: input.link_url ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async function markNotificationRead(notificationId: string) {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    })
    if (error) {
      const { error: fallbackError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
      if (fallbackError) throw fallbackError
    }
  }

  async function markAllNotificationsRead() {
    const { error } = await supabase.rpc('mark_all_notifications_read')
    if (error) {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id ?? user.value?.id
      if (!userId) throw new Error('No autenticado')
      const { error: fallbackError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      if (fallbackError) throw fallbackError
    }
  }

  async function deleteNotification(notificationId: string) {
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId)
    if (error) throw error
  }

  return {
    getAnnouncementMediaUrl,
    fetchPublicAnnouncements,
    fetchCampusAnnouncements,
    fetchAdminAnnouncements,
    fetchAnnouncementById,
    fetchPublicAnnouncementById,
    fetchMyNotifications,
    fetchUnreadCount,
    createAnnouncement,
    updateAnnouncement,
    updateAnnouncementStatus,
    deleteAnnouncement,
    uploadAnnouncementMedia,
    deleteAnnouncementMedia,
    sendNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  }
}
