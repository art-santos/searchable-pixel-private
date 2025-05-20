import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  username?: string
  full_name?: string
  email?: string
  avatar_url?: string
  company_domain?: string
  company_category?: string
  updated_at?: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClient()
  
  // Fetch user data
  useEffect(() => {
    let mounted = true
    
    async function getUser() {
      try {
        setLoading(true)
        
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        
        if (mounted) {
          setUser(user)
          
          if (user) {
            // Get the user's profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (profileError && profileError.code !== 'PGRST116') {
              // PGRST116 is "no rows returned", which is fine for new users
              console.error('Error fetching profile:', profileError)
            }
            
            if (mounted && profileData) {
              setProfile(profileData)
            } else if (mounted) {
              // If no profile exists yet, create default profile with user ID
              setProfile({ id: user.id })
            }
          } else {
            setProfile(null)
          }
        }
      } catch (err) {
        console.error('Error in useUser:', err)
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    getUser()
    
    // Set up auth state change listener
    const authListener = supabase ? supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user || null)
        
        if (session?.user && supabase) {
          // Get the user's profile when auth state changes
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (mounted && profileData) {
            setProfile(profileData)
          } else if (mounted) {
            setProfile({ id: session.user.id })
          }
        } else {
          setProfile(null)
        }
      }
    }) : { data: { subscription: { unsubscribe: () => {} } } };
    
    return () => {
      mounted = false
      authListener.data.subscription.unsubscribe()
    }
  }, [supabase])
  
  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated')
    if (!supabase) throw new Error('Supabase client is not initialized')
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (updatedProfile) {
        setProfile(updatedProfile)
      }
      
      return { success: true }
    } catch (err) {
      console.error('Error updating profile:', err)
      return { success: false, error: err }
    }
  }
  
  // Update company info
  const updateCompanyInfo = async (domain: string, category: string) => {
    return updateProfile({
      company_domain: domain,
      company_category: category
    })
  }
  
  return { user, profile, loading, error, updateProfile, updateCompanyInfo }
} 