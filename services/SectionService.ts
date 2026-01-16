// Re-export section functions from supabase.ts
export {
  getSections,
  getSectionsHierarchy,
  getSectionProgress,
  getSectionStatus
} from '../lib/supabase';

import { Section } from '../types';
import { supabase, isConfigured } from '../lib/supabase';

export const SectionService = {
  getAll: async (): Promise<Section[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_sections')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string): Promise<Section | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_sections')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  getByNumber: async (number: string): Promise<Section | null> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_sections')
      .select('*')
      .eq('number', number)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  getChildren: async (parentId: string): Promise<Section[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_sections')
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order');
    if (error) throw error;
    return data || [];
  },

  getByLevel: async (level: 1 | 2 | 3): Promise<Section[]> => {
    if (!isConfigured || !supabase) {
      throw new Error("Database not configured.");
    }
    const { data, error } = await supabase
      .from('serhub_sections')
      .select('*')
      .eq('level', level)
      .order('sort_order');
    if (error) throw error;
    return data || [];
  }
};
