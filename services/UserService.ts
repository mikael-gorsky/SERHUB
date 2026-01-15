import { db, isConfigured } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, query, where, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../firebaseConfig';
import { User, UserRole } from '../types';

export const UserService = {
  getAll: async (): Promise<User[]> => {
    if (isConfigured && db) {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
    }
    throw new Error("Database not configured.");
  },

  getById: async (id: string): Promise<User | undefined> => {
    if (isConfigured && db) {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return undefined;
    }
    throw new Error("Database not configured.");
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    if (isConfigured && db) {
      const q = query(collection(db, 'users'), where("email", "==", email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        return { id: d.id, ...d.data() } as User;
      }
      return undefined;
    }
    throw new Error("Database not configured.");
  },

  createUser: async (user: Omit<User, 'id'>): Promise<string> => {
    if (isConfigured && db) {
      const docRef = await addDoc(collection(db, 'users'), user);
      return docRef.id;
    }
    throw new Error("Database not configured.");
  },

  updateUser: async (user: User): Promise<void> => {
    if (isConfigured && db) {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, user, { merge: true });
    } else {
      throw new Error("Database not configured.");
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    if (isConfigured && db) {
      // Direct Firestore deletion
      await deleteDoc(doc(db, 'users', userId));
    } else {
      throw new Error("Database not configured.");
    }
  },

  updateUserRole: async (userId: string, newRole: UserRole): Promise<void> => {
    if (isConfigured && db) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
    } else {
      throw new Error("Database not configured.");
    }
  },

  provisionUserAccount: async (user: User, temporaryPassword: string): Promise<void> => {
    if (!isConfigured || !db || !user.email) {
      throw new Error("DB not configured or invalid user email.");
    }

    const secondaryAppName = `provisioning-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, temporaryPassword);
      const newUid = userCredential.user.uid;
      await signOut(secondaryAuth);

      const newUserDoc: User = { ...user, id: newUid };
      await setDoc(doc(db, 'users', newUid), newUserDoc);
      
      // Remove the old invitation/placeholder record if the ID changed
      if (user.id !== newUid) {
        await deleteDoc(doc(db, 'users', user.id));
      }
    } catch (error: any) {
      console.error("Provisioning failed:", error);
      throw error;
    }
  }
};