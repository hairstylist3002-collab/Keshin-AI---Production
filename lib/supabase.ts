import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for bypassing RLS (server-side operations only)
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// Auth helper functions
export const signUp = async (email: string, password: string, name: string, referralCode?: string) => {
  console.log('🔐 Starting signup for:', email, { hasReferralCode: !!referralCode });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        referral_code: referralCode,
      }
    }
  })

  console.log('📋 Signup result:', { data: !!data, error: error?.message });

  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Google OAuth authentication
export const signInWithGoogle = async () => {
  // Get referral code from localStorage if exists
  const referralCode = localStorage.getItem('referralCode');
  console.log('🔗 Google OAuth with referral code:', referralCode);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback${referralCode ? `?ref=${referralCode}` : ''}`,
      // Ensure Google shows the account chooser so user can switch accounts
      queryParams: { prompt: 'select_account' }
    }
  })

  console.log('📋 Google OAuth result:', { data: !!data, error: error?.message });

  return { data, error }
}

// General OAuth sign in function for other providers
export const signInWithProvider = async (provider: 'google' | 'github' | 'facebook') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  return { data, error }
}
