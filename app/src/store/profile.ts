import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ProfileState {
  profile: Profile | null
  loading: boolean
  levelUpEvent: { level: number } | null
  fetch: (userId: string) => Promise<void>
  refresh: (userId: string) => Promise<void>
  setLevelUpEvent: (e: { level: number } | null) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: true,
  levelUpEvent: null,

  fetch: async (userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) console.error('profile fetch:', error.code, error.message)
    set({ profile: data ?? null, loading: false })
  },

  refresh: async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) set({ profile: data })
  },

  setLevelUpEvent: (e) => set({ levelUpEvent: e }),
}))
