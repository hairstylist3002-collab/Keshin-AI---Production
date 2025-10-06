import { signUp, signIn, signInWithGoogle, supabase } from './supabase';
import { handleUserAuthData } from './userService';

export interface AuthResult {
  success: boolean;
  error?: string;
  userData?: any;
  data?: any;
}

/**
 * Handle email/password sign up with user data storage
 */
export const handleEmailSignup = async (email: string, password: string, name: string, gender?: string): Promise<AuthResult> => {
  try {
    // First, perform the authentication
    const { data, error } = await signUp(email, password, name);
    
    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.user) {
      // Store user data in the database (non-blocking)
      const userResult = await handleUserAuthData(
        data.user.id,
        name,
        email,
        false, // Not Google auth
        gender
      );

      if (!userResult.success) {
        console.warn('User data storage failed, but authentication succeeded:', userResult.error);
        // Don't fail the auth process, just log the warning
      }

      return { 
        success: true, 
        userData: {
          id: data.user.id,
          email: data.user.email,
          name: name
        }
      };
    }

    return { success: false, error: 'No user data returned from authentication' };
  } catch (error) {
    console.error('Error in handleEmailSignup:', error);
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
      // If it doesn't exist, the trigger should have created it
      return { 
        success: true, 
        userData: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || 'User'
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

    // Store user data in the database (non-blocking)
    const userResult = await handleUserAuthData(
      user.id,
      undefined, // Name will be extracted from Google data
      undefined, // Email will be extracted from Google data
      true // This is Google auth
    );

    if (!userResult.success) {
      console.warn('OAuth user data storage failed, but authentication succeeded:', userResult.error);
      // Don't fail the auth process, just log the warning
    }

    return { 
      success: true, 
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
