'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getUserProfile, UserProfile } from '@/lib/userService';
import { useRouter } from 'next/navigation';
import GenderSelectionPopup from '../app/components/GenderSelectionPopup';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showGenderPopup, setShowGenderPopup] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          setHasCheckedAuth(true);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        setLoading(false);
        setHasCheckedAuth(true);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            setUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  const cacheKey = typeof window !== 'undefined' ? `keshin-profile-${user?.id ?? 'anon'}` : null;

  const loadProfileFromCache = () => {
    if (!cacheKey || typeof window === 'undefined') {
      return null;
    }

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as { data: UserProfile; timestamp: number };
      // Cache is valid only for current tab session; optional staleness check could be added here.
      return parsed.data;
    } catch (err) {
      console.warn('Failed to read profile cache:', err);
      return null;
    }
  };

  const saveProfileToCache = (profileData: UserProfile) => {
    if (!cacheKey || typeof window === 'undefined') {
      return;
    }

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: profileData, timestamp: Date.now() }));
    } catch (err) {
      console.warn('Failed to persist profile cache:', err);
    }
  };

  const clearProfileCache = () => {
    if (!cacheKey || typeof window === 'undefined') {
      return;
    }

    sessionStorage.removeItem(cacheKey);
  };

  const fetchUserProfile = async (userId: string, { forceRefresh = false } = {}) => {
    try {
      if (!forceRefresh) {
        const cached = loadProfileFromCache();
        if (cached) {
          setProfile(cached);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      }

      const result = await getUserProfile(userId);
      
      if (result.success && result.data) {
        setProfile(result.data);
        setIsAuthenticated(true);
        saveProfileToCache(result.data);

        // Check if user has gender set, if not show popup
        const genderValue = result.data.gender;
        const normalizedGender = typeof genderValue === 'string' ? genderValue.trim().toLowerCase() : genderValue;
        if (genderValue === null || genderValue === undefined || normalizedGender === '' || normalizedGender === 'null') {
          console.log('Gender not set, showing gender popup for user:', userId, 'raw value:', genderValue, 'normalized:', normalizedGender);
          setShowGenderPopup(true);
        }
      } else {
        console.error('Failed to fetch user profile:', result.error);
        throw new Error(result.error || 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Handle the case where profile doesn't exist
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn('User profile not found, signing out');
        setProfile(null);
        setIsAuthenticated(false);
        clearProfileCache();

        try {
          // Sign out the user since their account was deleted
          await supabase.auth.signOut();
          setUser(null);
        } catch (signOutError) {
          console.error('Error during sign out:', signOutError);
        }
      } else {
        console.error('Error fetching user profile:', error);
        setProfile(null);
        setIsAuthenticated(false);
        clearProfileCache();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) {
      return;
    }

    const genderValue = profile.gender;
    const normalizedGender = typeof genderValue === 'string' ? genderValue.trim().toLowerCase() : genderValue;
    const needsGender = genderValue === null || genderValue === undefined || normalizedGender === '' || normalizedGender === 'null';

    if (needsGender) {
      console.log('Gender check effect: prompting user for gender selection', { genderValue, normalizedGender });
      setShowGenderPopup(true);
    } else {
      setShowGenderPopup(false);
    }
  }, [profile]);

  const handleGenderSelect = async (gender: 'male' | 'female' | 'other'): Promise<boolean> => {
    if (!user) {
      console.warn('handleGenderSelect called without an authenticated user');
      return false;
    }

    try {
      // Update user profile with gender
      const { error } = await supabase
        .from('user_profiles')
        .update({ gender: gender })
        .eq('id', user.id);

      if (error) throw error;

      // Update local profile state
      setProfile((prev) => {
        if (!prev) {
          return prev;
        }
        const updated = { ...prev, gender };
        saveProfileToCache(updated);
        return updated;
      });
      setShowGenderPopup(false);

      console.log('Gender updated successfully:', gender);
      return true;
    } catch (error) {
      console.error('Error updating gender:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      clearProfileCache();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated,
      signOut,
    }}>
      {children}
      <GenderSelectionPopup
        isVisible={showGenderPopup}
        onGenderSelect={handleGenderSelect}
      />
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
