import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';

/* ── Local user type that mirrors what we need from Firebase User ── */
export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export type AppUser = User | LocalUser;

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirebase: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/* ── Local auth helpers ── */
interface StoredUser {
  uid: string;
  email: string;
  displayName: string;
  password: string;
}

function getLocalUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem('taskmaster-users') || '[]');
  } catch { return []; }
}

function saveLocalUsers(users: StoredUser[]) {
  localStorage.setItem('taskmaster-users', JSON.stringify(users));
}

function getLocalSession(): LocalUser | null {
  try {
    const s = localStorage.getItem('taskmaster-session');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function setLocalSession(user: LocalUser | null) {
  if (user) localStorage.setItem('taskmaster-session', JSON.stringify(user));
  else localStorage.removeItem('taskmaster-session');
}

/* ── Provider ── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* Firebase listener */
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return unsub;
    } else {
      // Restore local session
      const session = getLocalSession();
      setUser(session);
      setLoading(false);
    }
  }, []);

  /* ── Sign In ── */
  const signIn = useCallback(async (email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const users = getLocalUsers();
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found) throw { code: 'auth/user-not-found' };
      if (found.password !== password) throw { code: 'auth/wrong-password' };
      const localUser: LocalUser = {
        uid: found.uid,
        email: found.email,
        displayName: found.displayName,
        photoURL: null,
      };
      setLocalSession(localUser);
      setUser(localUser);
    }
  }, []);

  /* ── Sign Up ── */
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
    } else {
      const users = getLocalUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw { code: 'auth/email-already-in-use' };
      }
      if (password.length < 6) throw { code: 'auth/weak-password' };
      const newUser: StoredUser = {
        uid: crypto.randomUUID(),
        email,
        displayName,
        password,
      };
      saveLocalUsers([...users, newUser]);
      const localUser: LocalUser = {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        photoURL: null,
      };
      setLocalSession(localUser);
      setUser(localUser);
    }
  }, []);

  /* ── Google Sign In ── */
  const signInWithGoogle = useCallback(async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      await signInWithPopup(auth, googleProvider);
    } else {
      throw { code: 'auth/operation-not-supported-in-this-environment' };
    }
  }, []);

  /* ── Sign Out ── */
  const signOut = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    } else {
      setLocalSession(null);
      setUser(null);
    }
  }, []);

  /* ── Reset Password ── */
  const resetPassword = useCallback(async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      // Local mode: just check if user exists
      const users = getLocalUsers();
      if (!users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw { code: 'auth/user-not-found' };
      }
      // In local mode we can't actually send an email, but we simulate success
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebase: isFirebaseConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
