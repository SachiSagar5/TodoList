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
import { flushSyncs } from '../utils/syncQueue';
import { API_URL } from '../config';

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

const API = API_URL;

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const STORAGE_KEY = 'taskmaster_session';

interface StoredSession {
  token: string;
  user: LocalUser;
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(token: string, user: LocalUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

let _token: string | null = loadSession()?.token ?? null;

export function getToken(): string | null {
  return _token;
}

async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    throw { code: 'server/unreachable' };
  }
  let body: T;
  try { body = await res.json(); } catch { body = null as T; }
  if (!res.ok) throw body || { code: 'server/error', error: `HTTP ${res.status}` };
  return body;
}

/* ── Provider ── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* On mount: Firebase listener or restore local session */
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return unsub;
    }

    const session = loadSession();
    if (session) {
      _token = session.token;
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  /* ── Sign In ── */
  const signIn = useCallback(async (email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password);
      return;
    }
      const { token, user: u } = await apiFetch<{ token: string; user: LocalUser }>('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      _token = token;
      saveSession(token, u);
      setUser(u);
  }, []);

  /* ── Sign Up ── */
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      return;
    }
    try {
      const { token, user: u } = await apiFetch<{ token: string; user: LocalUser }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      });
      _token = token;
      saveSession(token, u);
      setUser(u);
    } catch (err) {
      console.error('[signUp] caught error:', err);
      throw err;
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
      return;
    }
    await flushSyncs();
    if (_token) {
      try { await apiFetch('/api/auth/signout', { method: 'POST', headers: { Authorization: `Bearer ${_token}` } }); } catch {}
    }
    _token = null;
    clearSession();
    setUser(null);
  }, []);

  /* ── Reset Password ── */
  const resetPassword = useCallback(async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    try {
      await apiFetch<unknown>('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password: '__check__' }),
      });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'auth/user-not-found') throw { code: 'auth/user-not-found' };
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
