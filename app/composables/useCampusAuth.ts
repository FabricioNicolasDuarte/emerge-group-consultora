import type { CampusProfile, CampusRoleSlug } from '~/types/campus'
import { ROLE_DASHBOARD_PATHS, ROLE_HIERARCHY } from '~/types/campus'
import { resolveAuthUserId } from '~/utils/auth-user'

export function useCampusAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = useState<CampusProfile | null>('campus-profile', () => null)
  const profileLoading = useState('campus-profile-loading', () => false)
  const profileError = useState<string | null>('campus-profile-error', () => null)

  /** JWT may expose `sub` instead of `id` (@nuxtjs/supabase v2). */
  const authUserId = computed(() => resolveAuthUserId(user.value))

  async function fetchProfile() {
    if (!user.value) {
      profile.value = null
      return null
    }

    profileLoading.value = true
    profileError.value = null

    const { data, error } = await supabase
      .from('my_profile')
      .select('*')
      .maybeSingle()

    profileLoading.value = false

    if (error) {
      profileError.value = error.message
      profile.value = null
      return null
    }

    profile.value = data as CampusProfile | null
    return profile.value
  }

  const primaryRole = computed<CampusRoleSlug>(() => {
    const slugs = profile.value?.role_slugs ?? []
    if (!slugs.length) return 'alumno'

    return [...slugs].sort(
      (a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a],
    )[0] as CampusRoleSlug
  })

  const dashboardPath = computed(() => ROLE_DASHBOARD_PATHS[primaryRole.value])

  const displayName = computed(() => {
    if (profile.value?.full_name) return profile.value.full_name
    if (user.value?.email) return user.value.email.split('@')[0]
    return 'Usuario'
  })

  const initials = computed(() => {
    const name = displayName.value.trim()
    if (!name) return '?'
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  })

  function hasRole(...roles: CampusRoleSlug[]) {
    const slugs = profile.value?.role_slugs ?? []
    return roles.some((role) => slugs.includes(role))
  }

  function hasAnyStaffRole() {
    return hasRole('superadmin', 'admin', 'coordinador', 'docente', 'tutor')
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    await fetchProfile()
    if (profile.value && !profile.value.is_active) {
      profile.value = null
      await supabase.auth.signOut()
      throw new Error('Tu cuenta está desactivada. Contactá a administración.')
    }
    return data
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })
    if (error) throw error
    return data
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function updateOwnProfile(input: {
    full_name: string
    phone?: string | null
    city?: string | null
    job_role?: string | null
    occupation?: string | null
    audience?: string | null
    challenge?: string | null
  }) {
    const userId = authUserId.value
    if (!userId) throw new Error('Debés iniciar sesión')

    const payload = {
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      job_role: input.job_role?.trim() || null,
      occupation: input.occupation?.trim() || null,
      audience: input.audience?.trim() || null,
      challenge: input.challenge?.trim() || null,
    }

    if (!payload.full_name) throw new Error('El nombre es obligatorio')

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)

    if (error) throw error
    await fetchProfile()
  }

  async function uploadOwnAvatar(file: File) {
    const userId = authUserId.value
    if (!userId) throw new Error('Debés iniciar sesión')

    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen')
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen no puede superar 5 MB')
    }

    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `${userId}/avatar.${ext === 'jpeg' ? 'jpg' : ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = `${data.publicUrl}?v=${Date.now()}`

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (error) throw error
    await fetchProfile()
    return avatarUrl
  }

  async function removeOwnAvatar() {
    const userId = authUserId.value
    if (!userId) throw new Error('Debés iniciar sesión')

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId)

    if (error) throw error
    await fetchProfile()
  }

  async function signOut() {
    profile.value = null
    await supabase.auth.signOut()
    await navigateTo('/campus/login')
  }

  async function requestPasswordReset(email: string) {
    // Via API + Gmail SMTP (evita el rate limit ~2/h del mailer built-in de Supabase).
    await $fetch('/api/campus/auth/request-password-reset', {
      method: 'POST',
      body: { email: email.trim() },
    })
  }

  watch(
    user,
    async (current) => {
      if (current) {
        await fetchProfile()
      } else {
        profile.value = null
      }
    },
    { immediate: true },
  )

  return {
    user,
    authUserId,
    profile,
    profileLoading,
    profileError,
    primaryRole,
    dashboardPath,
    displayName,
    initials,
    hasRole,
    hasAnyStaffRole,
    fetchProfile,
    signIn,
    signUp,
    signOut,
    updatePassword,
    updateOwnProfile,
    uploadOwnAvatar,
    removeOwnAvatar,
    requestPasswordReset,
  }
}
