// Re-export profile functions from supabase.ts
export {
  getProfile,
  getProfiles,
  updateProfile,
  getUserTaskStats
} from '../lib/supabase';

import { Profile, SystemRole, User } from '../types';
import { supabase, isConfigured } from '../lib/supabase';

// Helper to convert Profile to User display object
export const profileToUser = (profile: Profile): User => ({
  id: profile.id,
  name: `${profile.first_name} ${profile.last_name}`,
  email: profile.email,
  role: profile.system_role,
  avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name + ' ' + profile.last_name)}&background=005695&color=fff`
});

export const UserService = {
  getAll: async (): Promise<Profile[]> => {
    console.log('UserService.getAll called, isConfigured:', isConfigured, 'supabase:', !!supabase);
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .eq('is_active', true)
      .order('last_name');
    console.log('UserService.getAll result:', { count: data?.length, error });
    if (error) throw error;
    return data || [];
  },

  getAllAsUsers: async (): Promise<User[]> => {
    const profiles = await UserService.getAll();
    return profiles.map(profileToUser);
  },

  getById: async (id: string): Promise<Profile | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  getByEmail: async (email: string): Promise<Profile | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .ilike('email', email)
      .single();
    if (error && error.code !== 'PGRST116') return null;
    return data;
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateSystemRole: async (userId: string, newRole: SystemRole): Promise<Profile | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .update({ system_role: newRole })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deactivateUser: async (userId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_profiles')
      .update({ is_active: false })
      .eq('id', userId);
    if (error) throw error;
    return true;
  },

  reactivateUser: async (userId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { error } = await supabase
      .from('serhub_profiles')
      .update({ is_active: true })
      .eq('id', userId);
    if (error) throw error;
    return true;
  },

  // Get users by role
  getByRole: async (role: SystemRole): Promise<Profile[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .eq('system_role', role)
      .eq('is_active', true)
      .order('last_name');
    if (error) throw error;
    return data || [];
  },

  // Search users by name
  search: async (query: string): Promise<Profile[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .eq('is_active', true)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('last_name');
    if (error) throw error;
    return data || [];
  }
};
