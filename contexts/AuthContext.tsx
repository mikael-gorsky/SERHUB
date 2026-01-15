
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, loginWithGoogle, loginWithEmail, logout } from '../lib/firebase';
import { UserService } from '../services/UserService';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedGuest = localStorage.getItem('serhub_guest_mode');
    if (savedGuest) {
      try {
        const guestUser = JSON.parse(savedGuest);
        setCurrentUser(guestUser);
      } catch (e) {
        localStorage.removeItem('serhub_guest_mode');
      }
    }
    
    if (!auth) {
      setLoading(false);
      return;
    }

    setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error", err));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user && localStorage.getItem('serhub_guest_mode')) {
        setLoading(false);
        return; 
      }

      if (user) {
        localStorage.removeItem('serhub_guest_mode');
        await syncUserWithFirestore(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const syncUserWithFirestore = async (firebaseUser: FirebaseUser) => {
    // Determine a friendly name fallback
    let friendlyName = firebaseUser.displayName;
    if (!friendlyName && firebaseUser.email) {
      // Split by dot or @ and capitalize
      const parts = firebaseUser.email.split('@')[0].split('.');
      friendlyName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }

    const fallbackUser: User = {
      id: firebaseUser.uid,
      name: friendlyName || 'Institutional User',
      email: firebaseUser.email || '',
      role: UserRole.TEAM_MEMBER,
      avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendlyName || 'U')}&background=005695&color=fff`
    };

    if (!db) {
      setCurrentUser(fallbackUser);
      return;
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        // Prioritize full name from database if it's set
        setCurrentUser({ 
          ...userData, 
          id: userSnap.id,
          name: userData.name || fallbackUser.name
        });
      } else {
        // Handle new Google Auth login or manual provisioning
        if (firebaseUser.email) {
          const invitedUser = await UserService.getByEmail(firebaseUser.email);
          if (invitedUser) {
            const mergedUser: User = {
              ...invitedUser,
              id: firebaseUser.uid,
              name: invitedUser.name || fallbackUser.name
            };
            await setDoc(userRef, mergedUser);
            await UserService.deleteUser(invitedUser.id);
            setCurrentUser(mergedUser);
            return;
          }
        }
        await setDoc(userRef, fallbackUser);
        setCurrentUser(fallbackUser);
      }
    } catch (error) {
      console.warn("Database sync failed, falling back to profile name:", error);
      setCurrentUser(fallbackUser);
    }
  };

  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      await loginWithEmail(email, pass);
    } catch (error) {
      console.error("Email Login failed", error);
      throw error;
    }
  };

  const enterGuestMode = () => {
    const guestUser: User = {
      id: 'guest-dev',
      name: 'Mikael Gorsky',
      email: 'mikaelg@hit.ac.il',
      role: UserRole.COORDINATOR,
      avatar: 'https://ui-avatars.com/api/?name=Mikael+Gorsky&background=005695&color=fff'
    };
    localStorage.setItem('serhub_guest_mode', JSON.stringify(guestUser));
    setCurrentUser(guestUser);
    setLoading(false);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('serhub_guest_mode');
      if (auth) await logout();
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout failed", error);
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signIn, signInEmail, signOut, enterGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
};
