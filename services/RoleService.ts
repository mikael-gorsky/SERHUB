import { supabase, isConfigured } from '../lib/supabase';

export interface Role {
  id: string;
  label: string;
  description?: string;
  color: string;
  can_manage: boolean;
  sort_order: number;
}

export const RoleService = {
  getAll: async (): Promise<Role[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_roles')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string): Promise<Role | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_roles')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};
