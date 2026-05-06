import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/api/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const role = ref(null)
  const loading = ref(true)

  const init = async () => {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        user.value = session.user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        profile.value = profileData
        role.value = profileData?.role || null
      }
    } catch (error) {
      console.error('Auth init error:', error)
    } finally {
      loading.value = false
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        user.value = session.user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        profile.value = profileData
        role.value = profileData?.role || null
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        profile.value = null
        role.value = null
      }
    })
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    profile.value = profileData
    role.value = profileData?.role || null
    return data
  }

  const register = async ({ email, password, first_name, last_name, role: userRole }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name, last_name, role: userRole } }
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      user.value = null
      profile.value = null
      role.value = null
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
      window.location.href = '/'
      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }

  const isLoggedIn = () => !!user.value

  return { user, profile, role, loading, init, login, register, logout, isLoggedIn }
})