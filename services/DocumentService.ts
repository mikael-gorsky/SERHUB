import { db, isConfigured } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MOCK_DOCS } from '../constants';
import { Document } from '../types';

export const DocumentService = {
  getAll: async (): Promise<Document[]> => {
    if (isConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'documents'));
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Document));
        }
        return [];
      } catch (e) {
        console.warn("Failed to fetch documents from DB.", e);
        return [];
      }
    }
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_DOCS]), 400));
  },

  getBySectionId: async (sectionId: string): Promise<Document[]> => {
    if (isConfigured && db) {
       try {
        // Simulating returning all docs for now as per previous logic, or filter if feasible
        // In a real app we'd filter by sectionId here too
        const snapshot = await getDocs(collection(db, 'documents'));
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Document));
        }
        return [];
      } catch (e) {
        console.warn("Failed to fetch documents from DB.", e);
        return [];
      }
    }
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_DOCS]), 500));
  }
};