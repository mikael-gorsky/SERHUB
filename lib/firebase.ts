import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, getDocs, Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut as firebaseSignOut, Auth } from 'firebase/auth';
import { firebaseConfig } from '../firebaseConfig';
import { 
  MOCK_SECTIONS, 
  MOCK_TASKS, 
  MOCK_DOCS, 
  MOCK_KNOWLEDGE, 
  MOCK_EVENTS, 
  USERS 
} from '../constants';

// --- INITIALIZATION ---
let appInstance;
let dbInstance: Firestore | undefined;
let authInstance: Auth | undefined;

const hasValidKey = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here';

if (hasValidKey) {
  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }
  dbInstance = getFirestore(appInstance);
  authInstance = getAuth(appInstance);
}

export const db = dbInstance;
export const auth = authInstance;
export const isConfigured = !!dbInstance;

// --- AUTH UTILITIES ---

export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Auth not configured.");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error("Auth not configured.");
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logout = async () => {
  if (!auth) return;
  return firebaseSignOut(auth);
};

export const getAppConfig = () => {
  return {
    projectId: firebaseConfig.projectId || 'None',
    isConfigured: isConfigured
  };
};

export const checkDatabaseConnection = async (): Promise<{success: boolean, message?: string}> => {
  if (!db) return { success: false, message: "Database configuration missing." };
  
  try {
    await getDocs(collection(db, '_connection_test_'));
    return { success: true };
  } catch (error: any) {
    console.error("Firestore connectivity error:", error);
    return { success: false, message: error.message };
  }
};

export const seedDatabase = async (): Promise<{success: boolean, message: string}> => {
  if (!db) return { success: false, message: "Database configuration missing." };
  
  try {
    const batch = writeBatch(db);
    
    // Cleanup helper (optional but recommended for clean rebuild)
    const collectionsToSeed = ['sections', 'tasks', 'documents', 'knowledge', 'events', 'users'];
    
    const addToBatch = (collectionName: string, data: any[]) => {
      data.forEach(item => {
        const ref = doc(db, collectionName, item.id);
        batch.set(ref, item);
      });
    };

    addToBatch('sections', MOCK_SECTIONS);
    addToBatch('tasks', MOCK_TASKS);
    addToBatch('documents', MOCK_DOCS);
    addToBatch('knowledge', MOCK_KNOWLEDGE);
    addToBatch('events', MOCK_EVENTS);
    addToBatch('users', USERS);

    await batch.commit();
    return { success: true, message: "Roadmap database rebuild successful!" };
  } catch (error: any) {
    console.error("Seed error:", error);
    return { success: false, message: `Seed Error: ${error.message}` };
  }
};