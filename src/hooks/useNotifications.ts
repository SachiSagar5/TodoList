import { useEffect, useRef } from 'react';
import type { PlannerEvent } from '../types';

const CHECK_INTERVAL = 60000;
const STORAGE_KEY = 'taskmaster_notified_events';

function getNotifiedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveNotifiedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useNotifications(events: PlannerEvent[]) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    intervalRef.current = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      const now = Date.now();
      const notified = getNotifiedIds();

      let changed = false;

      for (const event of events) {
        if (event.date !== today) continue;
        if (notified.has(event.id)) continue;

        const eventTime = event.time
          ? (() => {
              const [h, m] = event.time.split(':').map(Number);
              const d = new Date();
              d.setHours(h, m, 0, 0);
              return d.getTime();
            })()
          : null;

        if (eventTime && now < eventTime - 300000) continue;

        try {
          new Notification('Upcoming Event', {
            body: `${event.title}${event.time ? ` at ${event.time}` : ''}${event.description ? `\n${event.description}` : ''}`,
            icon: '/favicon.svg',
          });
        } catch {
          /* ignore */
        }

        notified.add(event.id);
        changed = true;
      }

      if (changed) saveNotifiedIds(notified);
    }, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [events]);
}
