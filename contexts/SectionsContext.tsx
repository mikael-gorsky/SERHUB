import React, { createContext, useContext, useEffect, useState } from 'react';
import { Section } from '../types';
import { getSectionsHierarchy, getSectionProgress, isConfigured } from '../lib/supabase';

interface SectionsContextType {
  sections: Section[];
  totalProgress: number;
  loading: boolean;
  error: string | null;
  refreshSections: () => Promise<void>;
}

const SectionsContext = createContext<SectionsContextType | undefined>(undefined);

export const useSections = () => {
  const context = useContext(SectionsContext);
  if (!context) {
    throw new Error('useSections must be used within a SectionsProvider');
  }
  return context;
};

export const SectionsProvider = ({ children }: { children?: React.ReactNode }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sections immediately on mount (parallel with auth)
  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    if (!isConfigured) {
      setLoading(false);
      setError('Database not configured');
      return;
    }

    try {
      console.log('[SectionsContext] Loading sections...');
      const hierarchy = await getSectionsHierarchy();
      console.log('[SectionsContext] Sections loaded:', hierarchy.length);
      setSections(hierarchy);

      // Calculate total progress (average of level 1 sections)
      if (hierarchy.length > 0) {
        let totalProg = 0;
        const progressPromises = hierarchy.map(section => getSectionProgress(section.id));
        const progressResults = await Promise.all(progressPromises);
        totalProg = progressResults.reduce((sum, prog) => sum + prog, 0);
        setTotalProgress(Math.round(totalProg / hierarchy.length));
      }

      setError(null);
    } catch (err) {
      console.error('[SectionsContext] Error loading sections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const refreshSections = async () => {
    setLoading(true);
    await loadSections();
  };

  return (
    <SectionsContext.Provider value={{
      sections,
      totalProgress,
      loading,
      error,
      refreshSections
    }}>
      {children}
    </SectionsContext.Provider>
  );
};
