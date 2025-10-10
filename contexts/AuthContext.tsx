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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showGenderPopup, setShowGenderPopup] = useState(false);
  const router = useRouter();

  const processPendingReferral = async (newUserId: string) => {
    if (typeof window === 'undefined') return;

    const referralCode = window.localStorage.getItem('referralCode');
    if (!referralCode) {
      return;
    }

    console.log('[AuthContext] Found pending referral code, processing...', {
      referralCode,
      newUserId
    });

    try {
      const response = await fetch('/api/handle-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ referralCode, newUserId })
      });

      const payload = await response.json().catch(() => ({}));

      console.log('[AuthContext] Referral API response', {
        status: response.status,
        ok: response.ok,
        payload
      });

      if (response.ok) {
        window.localStorage.removeItem('referralCode');
        console.log('[AuthContext] Referral processed successfully and code cleared');
        await fetchUserProfile(newUserId, { forceRefresh: true });
      } else {
        console.warn('[AuthContext] Referral processing failed', payload?.error || response.statusText);
      }
    } catch (error) {
      console.error('[AuthContext] Error calling referral API', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('🔐 Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('✅ Session found, user:', session.user.id);
          setUser(session.user);
          const success = await fetchUserProfile(session.user.id);
          setIsAuthenticated(success);
          if (success) {
            await processPendingReferral(session.user.id);
          }
        } else {
          console.log('❌ No active session found');
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, { hasSession: !!session, userId: session?.user?.id });

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in, fetching profile for:', session.user.id);
          setUser(session.user);
          const success = await fetchUserProfile(session.user.id);
          setIsAuthenticated(success);
          if (success) {
            await processPendingReferral(session.user.id);
            router.push('/Hairstylist');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setLoading(false);
          router.push('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const getCacheKey = (userId: string) => `keshin-profile-${userId}`;

  const loadProfileFromCache = (userId: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem(getCacheKey(userId));
      if (!cached) return null;
      const parsed = JSON.parse(cached) as { data: UserProfile; timestamp: number };
      return parsed.data;
    } catch (err) {
      console.warn('Failed to read profile cache:', err);
      return null;
    }
  };

  const saveProfileToCache = (userId: string, profileData: UserProfile) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        getCacheKey(userId),
        JSON.stringify({ data: profileData, timestamp: Date.now() })
      );
    } catch (err) {
      console.warn('Failed to persist profile cache:', err);
    }
  };

  const fetchUserProfile = async (userId: string, { forceRefresh = false } = {}): Promise<boolean> => {
    try {
      console.log('🔍 Fetching user profile for:', userId, { forceRefresh });

      if (!forceRefresh) {
        const cached = loadProfileFromCache(userId);
        if (cached) {
          console.log('✅ Using cached profile');
          setProfile(cached);
          setIsAuthenticated(true);
          setLoading(false);
          return true;
        }
      }

      console.log('📡 Querying database for profile...');
      const result = await getUserProfile(userId);

      if (result.success && result.data) {
        console.log('✅ Profile fetched successfully:', result.data.email);
        setProfile(result.data);
        setIsAuthenticated(true);
        saveProfileToCache(userId, result.data);

        const genderValue = result.data.gender;
        const normalizedGender = typeof genderValue === 'string' ? genderValue.trim().toLowerCase() : genderValue;
        if (genderValue === null || genderValue === undefined || normalizedGender === '' || normalizedGender === 'null') {
          setShowGenderPopup(true);
        }

        setLoading(false);
        return true;
      }

      console.warn('⚠️ Profile fetch failed:', result.error);
      console.warn('Profile not found, but continuing with authentication');
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }
  };

  const handleGenderSelect = async (gender: 'male' | 'female' | 'other'): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/profile/gender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, gender })
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error);

      const serverProfile: UserProfile = payload.data;
      setProfile(serverProfile);
      saveProfileToCache(user.id, serverProfile);
      setShowGenderPopup(false);
      return true;
    } catch (error) {
      console.error('Error updating gender:', error);
      return false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id, { forceRefresh: true });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated,
      signOut,
      refreshProfile,
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
