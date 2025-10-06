'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getCurrentUser, onAuthStateChange } from '@/lib/supabase'
import { getUserProfile, UserProfile } from '@/lib/userService'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const { user } = await getCurrentUser()

      if (user) {
        setUser(user)

        // Fetch user profile data
        try {
          const { success, data: profileData } = await getUserProfile(user.id)
          if (success && profileData) {
            setProfile(profileData)
          } else {
            console.warn('Failed to fetch user profile:', profileData)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }

      setLoading(false)
    }

    initializeAuth()

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // Fetch user profile data when user signs in
        try {
          const { success, data: profileData } = await getUserProfile(currentUser.id)
          if (success && profileData) {
            setProfile(profileData)
          } else {
            console.warn('Failed to fetch user profile after auth change:', profileData)
          }
        } catch (error) {
          console.error('Error fetching user profile after auth change:', error)
        }
      } else {
        // Clear profile data when user signs out
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user
  }
}
