import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, loginWithEmail, logout, isConfigured, getProfile } from '../lib/supabase';
import { User, Profile, SystemRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  currentProfile: Profile | null;
  loading: boolean;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to convert Profile to User for display
const profileToUser = (profile: Profile): User => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  isUser: profile.is_user,
  avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=005695&color=fff`
});

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Check for guest mode first
      const savedGuest = localStorage.getItem('serhub_guest_mode');
      if (savedGuest) {
        try {
          const guestData = JSON.parse(savedGuest);
          if (mounted) {
            setCurrentUser(guestData.user);
            setCurrentProfile(guestData.profile);
            setLoading(false);
          }
          return;
        } catch (e) {
          localStorage.removeItem('serhub_guest_mode');
        }
      }

      if (!supabase || !isConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      // Check for existing session with timeout
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeout]) as any;

        if (session?.user && mounted) {
          await syncUserWithSupabase(session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    let subscription: any = null;
    if (supabase && isConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          localStorage.removeItem('serhub_guest_mode');
          await syncUserWithSupabase(session.user);
        } else if (!localStorage.getItem('serhub_guest_mode')) {
          setCurrentUser(null);
          setCurrentProfile(null);
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const syncUserWithSupabase = async (supabaseUser: SupabaseUser) => {
    const fallbackName = supabaseUser.email?.split('@')[0] || 'User';
    const fallbackUser: User = {
      id: supabaseUser.id,
      name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
      email: supabaseUser.email || '',
      role: 'contributor' as SystemRole,
      isUser: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=005695&color=fff`
    };

    try {
      // Fetch profile with generous timeout (15 seconds)
      const timeout = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000));
      const profile = await Promise.race([getProfile(supabaseUser.id), timeout]);

      if (profile) {
        setCurrentProfile(profile);
        setCurrentUser(profileToUser(profile));
      } else {
        setCurrentUser(fallbackUser);
        setCurrentProfile(null);
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      setCurrentUser(fallbackUser);
      setCurrentProfile(null);
    }
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (!supabase || !currentUser) return;
    const profile = await getProfile(currentUser.id);
    if (profile) {
      setCurrentProfile(profile);
      setCurrentUser(profileToUser(profile));
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      await loginWithEmail(email, pass);
    } catch (error) {
      console.error("Email Login failed", error);
      throw error;
    }
  };

  const enterGuestMode = () => {
    // Guest mode for development - simulates admin user
    const guestProfile: Profile = {
      id: 'guest-dev',
      name: 'Mikael Gorsky',
      email: 'MikaelG@hit.ac.il',
      is_user: true,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const guestUser = profileToUser(guestProfile);

    localStorage.setItem('serhub_guest_mode', JSON.stringify({ user: guestUser, profile: guestProfile }));
    setCurrentProfile(guestProfile);
    setCurrentUser(guestUser);
    setLoading(false);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('serhub_guest_mode');
      if (supabase) await logout();
      setCurrentUser(null);
      setCurrentProfile(null);
    } catch (error) {
      console.error("Logout failed", error);
      setCurrentUser(null);
      setCurrentProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      currentProfile,
      loading,
      signInEmail,
      signOut,
      enterGuestMode,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
