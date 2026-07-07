import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, getToken } from '../contexts/AuthContext';
import { enqueueSync } from '../utils/syncQueue';
import { API_URL } from '../config';

const API = API_URL;

export function useApiCollection<T extends { id: string }>(
  collectionName: string
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean, string | null] {
  const { user, signOut } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const syncToServer = useCallback(async (prev: T[], next: T[]) => {
    const token = getToken();
    if (!user || !token) return;

    try {
      const changedItems: T[] = [];
      const deletedIds: string[] = [];

      for (const item of next) {
        const prevItem = prev.find(p => p.id === item.id);
        if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
          changedItems.push(item);
        }
      }

      for (const prevItem of prev) {
        if (!next.find(n => n.id === prevItem.id)) {
          deletedIds.push(prevItem.id);
        }
      }

      if (changedItems.length === 0 && deletedIds.length === 0) return;

      const res = await fetch(`${API}/api/data/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          updates: changedItems.map(item => ({ collection: collectionName, ...item })),
          deletions: deletedIds.map(id => ({ collection: collectionName, id })),
        }),
      });
      if (res.status === 401) { await signOut(); return; }
      if (!res.ok) console.error(`Batch sync ${collectionName} failed:`, await res.text());
    } catch (err) {
      console.error(`Sync ${collectionName} error:`, err);
    }
  }, [user, collectionName, signOut]);

  const prevRef = useRef<T[]>([]);

  useEffect(() => {
    if (loading) return;
    const prev = prevRef.current;
    if (prev === data) return;
    prevRef.current = data;
    enqueueSync(() => syncToServer(prev, data));
  }, [data, loading, syncToServer]);

  useEffect(() => {
    if (!user) {
      setData([]);
      setFetchError(null);
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setData([]);
      setFetchError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch(`${API}/api/data/${collectionName}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (res.status === 401) {
          setFetchError('Session expired. Try signing out and back in.');
          return null;
        }
        if (!res.ok) throw new Error(res.statusText);
        setFetchError(null);
        return res.json();
      })
      .then(items => {
        if (!cancelled) {
          if (items) {
            setData(items);
            prevRef.current = items;
          }
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error(`Error fetching ${collectionName}:`, err);
          setFetchError('Could not reach server. Make sure the API server is running.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [user, collectionName]);

  const setDataWithSync: React.Dispatch<React.SetStateAction<T[]>> = useCallback(
    (action) => {
      setData(prev => {
        const next = typeof action === 'function' ? (action as (prev: T[]) => T[])(prev) : action;
        return next;
      });
    },
    []
  );

  return [data, setDataWithSync, loading, fetchError];
}
