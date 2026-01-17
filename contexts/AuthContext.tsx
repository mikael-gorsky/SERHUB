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
  name: `${profile.first_name} ${profile.last_name}`,
  email: profile.email,
  role: profile.system_role,
  avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name + ' ' + profile.last_name)}&background=005695&color=fff`
});

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for guest mode first
    const savedGuest = localStorage.getItem('serhub_guest_mode');
    if (savedGuest) {
      try {
        const guestData = JSON.parse(savedGuest);
        setCurrentUser(guestData.user);
        setCurrentProfile(guestData.profile);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('serhub_guest_mode');
      }
    }

    if (!supabase || !isConfigured) {
      setLoading(false);
      return;
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserWithSupabase(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        localStorage.removeItem('serhub_guest_mode');
        await syncUserWithSupabase(session.user);
      } else if (!localStorage.getItem('serhub_guest_mode')) {
        setCurrentUser(null);
        setCurrentProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserWithSupabase = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch profile from serhub_profiles
      const profile = await getProfile(supabaseUser.id);

      if (profile) {
        setCurrentProfile(profile);
        setCurrentUser(profileToUser(profile));
      } else {
        // Profile should be auto-created by trigger, but handle edge case
        // Create a fallback user display
        const fallbackName = supabaseUser.email?.split('@')[0] || 'User';
        const fallbackUser: User = {
          id: supabaseUser.id,
          name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
          email: supabaseUser.email || '',
          role: 'member' as SystemRole,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=005695&color=fff`
        };
        setCurrentUser(fallbackUser);
        setCurrentProfile(null);
        console.warn('Profile not found for user, using fallback');
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      // Set fallback user on error
      const fallbackName = supabaseUser.email?.split('@')[0] || 'User';
      setCurrentUser({
        id: supabaseUser.id,
        name: fallbackName,
        email: supabaseUser.email || '',
        role: 'member' as SystemRole,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=005695&color=fff`
      });
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
      email: 'MikaelG@hit.ac.il',
      first_name: 'Mikael',
      last_name: 'Gorsky',
      organization_role: 'department_faculty',
      system_role: 'admin',  // admin | supervisor | collaborator
      is_active: true,
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
