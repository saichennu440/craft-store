import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper functions
export const getUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error fetching session:', error.message)
    return null
  }
  return session?.user || null
}

export const isAdmin = async (): Promise<boolean> => {
  const user = await getUser()
  if (!user) return false

  // 👇 Explicitly tell TS what shape to expect
  type UserRoleRow = { role: 'user' | 'admin' }

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<UserRoleRow>()

  if (error) {
    console.error('Error checking admin role:', error.message)
    return false
  }

  return data?.role === 'admin'
}

export const uploadImage = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}
