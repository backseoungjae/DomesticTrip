import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { tripRepository } from '@/database/tripRepository';
import { addCalendarDays, getSeoulToday } from '@/shared/date/calendarDate';

function useFocusedData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const refreshRef = useRef<(() => Promise<boolean>) | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let request = 0;
      const refresh = async () => {
        const current = ++request;
        setLoading(true);
        setError(false);
        try {
          const next = await load();
          if (!active || current !== request) return false;
          setData(next);
          return true;
        } catch {
          if (active && current === request) setError(true);
          return false;
        } finally {
          if (active && current === request) setLoading(false);
        }
      };
      refreshRef.current = refresh;
      void refresh();
      const listener = AppState.addEventListener('change', (state) => {
        if (state === 'active') void refresh();
      });
      return () => {
        active = false;
        if (refreshRef.current === refresh) refreshRef.current = null;
        listener.remove();
      };
    }, [load, attempt]),
  );
  const refresh = useCallback(() => refreshRef.current?.() ?? Promise.resolve(false), []);
  return { data, loading, error, refresh, retry: () => setAttempt((value) => value + 1) };
}

export function useTrips() {
  return useFocusedData(tripRepository.list);
}

export function useTrip(id: string) {
  return useFocusedData(useCallback(() => tripRepository.get(id), [id]));
}

export function useTripDetail(id: string) {
  return useFocusedData(useCallback(() => tripRepository.getWithPlaces(id), [id]));
}

export function useSeoulToday() {
  const [today, setToday] = useState(getSeoulToday);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const next = getSeoulToday();
      setToday(next);
      // This is a clock deadline, not a conversion of a stored travel date.
      const midnight = new Date(`${addCalendarDays(next, 1)}T00:00:00+09:00`).getTime();
      timer = setTimeout(refresh, Math.max(1000, midnight - Date.now() + 100));
    };
    refresh();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      listener.remove();
    };
  }, []);
  return today;
}
