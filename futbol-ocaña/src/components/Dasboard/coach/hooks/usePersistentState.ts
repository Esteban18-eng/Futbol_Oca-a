import { useState, useEffect, useCallback } from 'react';

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  storage = sessionStorage
): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }, [key, state, storage]);

  const setPersistentState = useCallback((value: T | ((val: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as (val: T) => T)(prev) : value;
      return newValue;
    });
  }, []);

  return [state, setPersistentState];
}