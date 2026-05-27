import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setData([]);
      setLoading(false);
      return;
    }

    const colRef = collection(db, 'users', user.uid, collectionName);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        setData(items);
        setLoading(false);
      },
      (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        setLoading(false);
      }
    );

    return unsub;
  }, [user, collectionName]);

  const setDataWithSync: React.Dispatch<React.SetStateAction<T[]>> = useCallback(
    (action) => {
      setData((prev) => {
        const next = typeof action === 'function' ? (action as (prev: T[]) => T[])(prev) : action;

        if (!user || !db) return next;

        const prevIds = new Set(prev.map((item) => item.id));
        const nextIds = new Set(next.map((item) => item.id));

        // Add or update items
        for (const item of next) {
          const prevItem = prev.find((p) => p.id === item.id);
          if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
            const docRef = doc(db, 'users', user.uid, collectionName, item.id);
            setDoc(docRef, { ...item }).catch(console.error);
          }
        }

        // Delete removed items
        for (const id of prevIds) {
          if (!nextIds.has(id)) {
            const docRef = doc(db, 'users', user.uid, collectionName, id);
            deleteDoc(docRef).catch(console.error);
          }
        }

        return next;
      });
    },
    [user, collectionName]
  );

  return [data, setDataWithSync, loading];
}
