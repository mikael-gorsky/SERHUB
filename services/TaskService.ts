
import { db, isConfigured } from '../lib/firebase';
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Task } from '../types';

export const TaskService = {
  getAll: async (): Promise<Task[]> => {
    if (isConfigured && db) {
      const snapshot = await getDocs(collection(db, 'tasks'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
    }
    throw new Error("Database not configured.");
  },

  getBySectionId: async (sectionId: string): Promise<Task[]> => {
    if (isConfigured && db) {
      const q = query(collection(db, 'tasks'), where("sectionId", "==", sectionId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
    }
    throw new Error("Database not configured.");
  },

  updateTask: async (task: Task): Promise<void> => {
    if (isConfigured && db) {
      const taskRef = doc(db, 'tasks', task.id);
      const { id, ...data } = task;
      await setDoc(taskRef, data, { merge: true });
    } else {
      throw new Error("Database not configured.");
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, 'tasks', taskId));
    } else {
      throw new Error("Database not configured.");
    }
  }
};
