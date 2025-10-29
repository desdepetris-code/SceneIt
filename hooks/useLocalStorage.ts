
import React, { useState, useEffect } from 'react';

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = window.localStorage.getItem(key);
    if (item === null) {
        return initialValue;
    }
    try {
      // Standard way: parse JSON
      return JSON.parse(item);
    } catch (error) {
      // Fallback for legacy data that might not be JSON stringified.
      // This is specifically for `profilePictureUrl` which might have been stored as a raw URL string in the past.
      if (key.startsWith('profilePictureUrl_') && typeof item === 'string') {
          console.warn(`Could not parse JSON for key "${key}". Falling back to raw string value for backward compatibility.`);
          return item as unknown as T;
      }

      console.error(`Failed to parse localStorage item for key "${key}". Returning initial value.`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore = typeof storedValue === 'function' ? storedValue(storedValue) : storedValue;
      // Always store as a JSON string for consistency moving forward.
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
