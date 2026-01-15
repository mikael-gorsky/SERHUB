import { db, isConfigured } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Section } from '../types';

export const SectionService = {
  getAll: async (): Promise<Section[]> => {
    if (isConfigured && db) {
      const snapshot = await getDocs(collection(db, 'sections'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Section));
    }
    throw new Error("Database not configured.");
  },

  getById: async (id: string): Promise<Section | undefined> => {
    if (isConfigured && db) {
      const docRef = doc(db, 'sections', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Section;
      }
      return undefined;
    }
    throw new Error("Database not configured.");
  }
};