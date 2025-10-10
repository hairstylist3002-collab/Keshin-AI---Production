import { signUp, signIn, signInWithGoogle, supabase } from './supabase';

export interface AuthResult {
  success: boolean;
  error?: string;
  userData?: any;
  data?: any;
  code?: string;
  created?: boolean;
}

/**
 * Handle email/password sign up with user data storage
 */
export const handleEmailSignup = async (
  email: string,
  password: string,
  name: string,
  referralCode?: string
): Promise<AuthResult> => {
  try {
    console.log('🔄 Starting email signup for:', email, { hasReferralCode: !!referralCode });

    // First, perform the authentication
    const { data, error } = await signUp(email, password, name, referralCode);

    if (error) {
      console.error('❌ Signup error:', error);
      if (error.message === 'User already registered') {
        return {
          success: false,
          error: 'Account already exists. Please sign in instead.',
          code: 'USER_ALREADY_EXISTS'
        };
      }
      return { success: false, error: error.message };
    }

    if (data?.user) {
      console.log('✅ User created successfully:', data.user.id);

      const created = true;

      return {
        success: true,
        created,
        userData: {
          id: data.user.id,
          email: data.user.email,
          name: name
        }
      };
    }

    console.error('❌ No user data returned from authentication');
    return { success: false, error: 'No user data returned from authentication' };
  } catch (error) {
    console.error('❌ Error in handleEmailSignup:', error);
    return { success: false, error: 'An unexpected error occurred during sign up' };
  }
};

/**
 * Handle email/password sign in
 */
export const handleEmailSignin = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const { data, error } = await signIn(email, password);
    
    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.user) {
      // For sign in, we assume user profile already exists
      // Just return the user data, no need to create a new profile here
      return { 
        success: true, 
        userData: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || ''
        }
      };
    }
    
    return { success: false, error: 'No user data returned from authentication' };
  } catch (error) {
    console.error('Error in handleEmailSignin:', error);
    return { success: false, error: 'An unexpected error occurred during sign in' };
  }
};

/**
 * Handle Google OAuth sign in with user data storage
 */
export const handleGoogleSignin = async (): Promise<AuthResult> => {
  try {
    // Initiate Google OAuth
    const { data, error } = await signInWithGoogle();
    
    if (error) {
      return { success: false, error: error.message };
    }

    // Note: For OAuth, the user data storage will be handled
    // after the redirect completes, in the auth callback
    return { success: true, data };
  } catch (error) {
    console.error('Error in handleGoogleSignin:', error);
    return { success: false, error: 'An unexpected error occurred during Google sign in' };
  }
};

/**
 * Handle OAuth callback and store user data
 */
export const handleOAuthCallback = async (): Promise<AuthResult> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { success: false, error: 'Unable to get user data from OAuth callback' };
    }

    return { 
      success: true, 
      created: false,
      userData: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'Google User'
      }
    };
  } catch (error) {
    console.error('Error in handleOAuthCallback:', error);
    return { success: false, error: 'An unexpected error occurred during OAuth callback' };
  }
};
