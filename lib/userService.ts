import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender?: string;
  referral_code: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

/**
 * Gets a user profile by their ID. The database trigger is now responsible for creation.
 */
export const getUserProfile = async (userId: string): Promise<{ success: boolean; error?: string; data?: UserProfile }> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'User profile not found.' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('Error in getUserProfile:', message);
    return { success: false, error: message };
  }
};
