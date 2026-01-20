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
  name: profile.name,
  email: profile.email,
  role: profile.role,
  isUser: profile.is_user,
  avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=005695&color=fff`
});

export const UserService = {
  // Get all profiles (both users and non-users)
  getAll: async (): Promise<Profile[]> => {
    console.log('UserService.getAll called, isConfigured:', isConfigured, 'supabase:', !!supabase);
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .order('name');
    console.log('UserService.getAll result:', { count: data?.length, error });
    if (error) throw error;
    return data || [];
  },

  // Get only login-capable users (for login dropdown)
  getLoginUsers: async (): Promise<Profile[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .eq('is_user', true)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  // Get all as User display objects (login users only)
  getAllAsUsers: async (): Promise<User[]> => {
    const profiles = await UserService.getLoginUsers();
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

  updateRole: async (userId: string, newRole: SystemRole): Promise<Profile | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Get profiles by role
  getByRole: async (role: SystemRole): Promise<Profile[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .eq('role', role)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  // Search profiles by name or email
  search: async (query: string): Promise<Profile[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_profiles')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  // Create a new non-user collaborator
  createCollaborator: async (collaborator: {
    name: string;
    email: string;
    description?: string;
    other_contact?: string;
    role?: SystemRole;
  }): Promise<Profile | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    // Generate UUID for non-user profiles
    const newId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('serhub_profiles')
      .insert({
        id: newId,
        name: collaborator.name,
        email: collaborator.email,
        description: collaborator.description || null,
        other_contact: collaborator.other_contact || null,
        role: collaborator.role || 'contributor',
        is_user: false
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete a non-user collaborator (only non-users can be deleted)
  deleteCollaborator: async (profileId: string): Promise<boolean> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    // First check if it's a non-user
    const profile = await UserService.getById(profileId);
    if (!profile) throw new Error("Profile not found");
    if (profile.is_user) throw new Error("Cannot delete a user account. Only non-user collaborators can be deleted.");

    const { error } = await supabase
      .from('serhub_profiles')
      .delete()
      .eq('id', profileId);
    if (error) throw error;
    return true;
  }
};
