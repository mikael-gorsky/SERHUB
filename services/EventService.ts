import { db, isConfigured } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { MOCK_EVENTS } from '../constants';
import { CalendarEvent } from '../types';

export const EventService = {
  getAll: async (): Promise<CalendarEvent[]> => {
    if (isConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'events'));
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent));
        }
        return [];
      } catch (e) {
        console.warn("Failed to fetch events from DB.", e);
        return [];
      }
    }
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_EVENTS]), 350));
  }
};