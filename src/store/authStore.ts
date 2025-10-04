import { create } from 'zustand'
import { supabase, isAdmin } from '../lib/supabase'
import type { User } from '../types/database'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isAdminUser: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  checkAdminStatus: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isAuthenticated: false,
  isAdminUser: false,
  loading: true,
  
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (userData) {
        set({ 
          user: userData, 
          isAuthenticated: true,
          isAdminUser: (userData as any).role === 'admin'
        })
      }
    }
  },
  
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) throw error
    
    if (data.user) {
      // Create user profile
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role: 'user'
      } as any)
      
      if (insertError) throw insertError
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false, isAdminUser: false })
  },
  
  initialize: async () => {
    set({ loading: true })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (userData) {
        set({ 
          user: userData, 
          isAuthenticated: true,
          isAdminUser: (userData as any).role === 'admin'
        })
      }
    }
    
    set({ loading: false })
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (userData) {
          set({ 
            user: userData, 
            isAuthenticated: true,
            isAdminUser: (userData as any).role === 'admin'
          })
        }
      } else {
        set({ user: null, isAuthenticated: false, isAdminUser: false })
      }
    })
  },
  
  checkAdminStatus: async () => {
    const adminStatus = await isAdmin()
    set({ isAdminUser: adminStatus })
  }
}))