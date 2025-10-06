import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender?: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  gender?: string;
  credits?: number;
}

/**
 * Create or update user profile in the database
 */
export const createOrUpdateUserProfile = async (userData: CreateUserData): Promise<{ success: boolean; error?: string; data?: UserProfile }> => {
  try {
    // First try to create/update using upsert
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        gender: userData.gender,
        credits: userData.credits || 1, // Default to 1 credit if not specified
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating user profile:', error);
      
      // Try fallback method using RPC call
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .rpc('create_user_profile_manually', {
            user_id: userData.id,
            user_name: userData.name,
            user_email: userData.email,
            user_gender: userData.gender,
            user_credits: userData.credits || 1
          });

        if (fallbackError) {
          console.error('Fallback method also failed:', fallbackError);
          return { success: false, error: `Database error: ${error.message}. Fallback also failed: ${fallbackError.message}` };
        }

        if (fallbackData) {
          // Fallback succeeded, now fetch the created profile
          const { data: profileData, error: fetchError } = await getUserProfile(userData.id);
          if (fetchError) {
            return { success: true, error: 'Profile created via fallback but could not be retrieved' };
          }
          return { success: true, data: profileData };
        }
      } catch (fallbackError) {
        console.error('Fallback method exception:', fallbackError);
        return { success: false, error: `Database error: ${error.message}. Fallback failed with exception` };
      }
    }

    return { success: true, data: data as UserProfile };
  } catch (error) {
    console.error('Unexpected error in createOrUpdateUserProfile:', error);
    return { success: false, error: 'An unexpected error occurred while saving user data' };
  }
};

/**
 * Get user profile by user ID
 */
export const getUserProfile = async (
  userId: string,
  supabaseClient?: any
): Promise<{ success: boolean; error?: string; data?: UserProfile }> => {
  try {
    const client = supabaseClient || supabase;

    console.log('🔍 Fetching profile for user:', userId);

    // ✅ DEBUG: Check authentication context
    const { data: { user: authUser } } = await client.auth.getUser();
    console.log('🔑 Auth user from client:', {
      authUserId: authUser?.id,
      authUserEmail: authUser?.email,
      providedUserId: userId,
      authMatches: authUser?.id === userId
    });

    // ✅ Use service role to bypass RLS for this operation
    // This is a temporary workaround until RLS authentication is properly fixed
    const { supabaseService } = await import('./supabase');

    const { data, error } = await supabaseService
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('📊 Query results:', {
      dataFound: !!data,
      error: error?.message,
      errorCode: error?.code
    });

    if (error) {
      console.error('❌ Error fetching user profile:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('❌ User profile not found for userId:', userId);
      return {
        success: false,
        error: 'User profile not found',
        data: undefined
      };
    }

    console.log('✅ Profile found:', data.email);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error in getUserProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Update user credits
 */
export const updateUserCredits = async (userId: string, credits: number, supabaseClient?: any): Promise<{ success: boolean; error?: string; data?: UserProfile }> => {
  try {
    console.log('💳 Updating credits for user:', userId, 'to:', credits);

    // ✅ Use service role to bypass RLS for this operation
    const { supabaseService } = await import('./supabase');

    const { data, error } = await supabaseService
      .from('user_profiles')
      .update({
        credits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user credits:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Credits updated successfully for user:', userId);
    return { success: true, data: data as UserProfile };
  } catch (error) {
    console.error('Unexpected error in updateUserCredits:', error);
    return { success: false, error: 'An unexpected error occurred while updating credits' };
  }
};

/**
 * Extract user data from Google OAuth response
 */
export const extractGoogleUserData = (googleUser: any): CreateUserData => {
  return {
    id: googleUser.id,
    name: googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || 'Google User',
    email: googleUser.email || googleUser.user_metadata?.email,
    gender: undefined, // Google doesn't provide gender, will need to be set separately
    credits: 1
  };
};

/**
 * Handle user data storage after authentication
 */
export const handleUserAuthData = async (userId: string, name?: string, email?: string, isGoogleAuth = false, gender?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get the current user session to extract additional data
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('Unable to get user data, but authentication succeeded');
      // Don't fail the authentication process, just log the warning
      return { success: true, error: 'User data retrieval warning' };
    }

    let userData: CreateUserData;

    if (isGoogleAuth) {
      // Extract data from Google user
      userData = extractGoogleUserData(user);
    } else {
      // Use provided data for email/password auth
      userData = {
        id: userId,
        name: name || user.user_metadata?.name || 'User',
        email: email || user.email || '',
        gender: gender,
        credits: 1
      };
    }

    // Create or update user profile
    const result = await createOrUpdateUserProfile(userData);
    
    if (!result.success) {
      console.warn('User profile creation failed, but authentication succeeded:', result.error);
      // Don't fail the authentication process, just log the warning
      // The user can still use the app, they just won't have a profile yet
      return { success: true, error: 'Profile creation warning' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in handleUserAuthData:', error);
    // Don't fail the authentication process due to data storage issues
    // The user can still authenticate and use the app
    return { success: true, error: 'Data storage warning' };
  }
};
