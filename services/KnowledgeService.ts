import { db, isConfigured } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { MOCK_KNOWLEDGE } from '../constants';
import { KnowledgeItem } from '../types';

export const KnowledgeService = {
  getAll: async (): Promise<KnowledgeItem[]> => {
    if (isConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'knowledge'));
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeItem));
        }
        return [];
      } catch (e) {
        console.warn("Failed to fetch knowledge from DB.", e);
        return [];
      }
    }
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_KNOWLEDGE]), 300));
  },

  getBySectionId: async (sectionId: string): Promise<KnowledgeItem[]> => {
    if (isConfigured && db) {
      try {
        const q = query(collection(db, 'knowledge'), where("tags", "array-contains", sectionId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeItem));
        } else {
            return [];
        }
      } catch (e) {
        console.warn("Failed to fetch section knowledge from DB.", e);
        return [];
      }
    }
    return new Promise((resolve) => 
      setTimeout(() => resolve(MOCK_KNOWLEDGE.filter(k => k.tags.includes(sectionId))), 400)
    );
  }
};