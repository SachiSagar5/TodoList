import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, getToken } from '../contexts/AuthContext';
import { API_URL } from '../config';

const API = API_URL;

export function useApiCollection<T extends { id: string }>(
  collectionName: string
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const syncToServer = useCallback(async (prev: T[], next: T[]) => {
    const token = getToken();
    if (!user || !token) return;

    try {
      for (const item of next) {
        const prevItem = prev.find(p => p.id === item.id);
        if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
          console.log(`[api:${collectionName}] POST ${item.id}`, item);
          const res = await fetch(`${API}/api/data/${collectionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(item),
          });
          if (!res.ok) console.error(`POST ${collectionName} failed:`, await res.text());
        }
      }

      for (const prevItem of prev) {
        if (!next.find(n => n.id === prevItem.id)) {
          console.log(`[api:${collectionName}] DELETE ${prevItem.id}`);
          const res = await fetch(`${API}/api/data/${collectionName}/${prevItem.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) console.error(`DELETE ${collectionName} failed:`, await res.text());
        }
      }
    } catch (err) {
      console.error(`Sync ${collectionName} error:`, err);
    }
  }, [user, collectionName]);

  const prevRef = useRef<T[]>([]);

  useEffect(() => {
    if (loading) return;
    const prev = prevRef.current;
    if (prev === data) return;
    prevRef.current = data;
    syncToServer(prev, data);
  }, [data, loading, syncToServer]);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch(`${API}/api/data/${collectionName}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
      .then(items => { if (!cancelled) { setData(items); prevRef.current = items; setLoading(false); } })
      .catch(err => { console.error(`Error fetching ${collectionName}:`, err); if (!cancelled) setLoading(false); });
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

  return [data, setDataWithSync, loading];
}
