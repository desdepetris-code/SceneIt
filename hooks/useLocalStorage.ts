/*
 * NOTE FOR BACKEND INTEGRATION:
 * This hook is the primary mechanism for client-side data persistence using localStorage.
 * To implement multi-device sync as requested, this entire data layer needs to be replaced.
 * 
 * Proposed Architecture:
 * 1. Firebase Authentication: Replace the mock user system in `App.tsx` with Firebase Auth.
 * 2. Firestore Database: Create a 'users' collection where each document corresponds to a user ID from Firebase Auth.
 *    - All data currently stored in localStorage (watching, history, progress, etc.) would become fields or subcollections within that user's document.
 * 3. `useUserData` Hook: Create a new hook (e.g., `useUserData`) that replaces all individual `useLocalStorage` calls in `MainApp.tsx`.
 *    - This hook would establish a real-time listener to the user's document in Firestore using `onSnapshot`.
 *    - It would provide the `userData` object and an `updateUserData` function to the `MainApp` component.
 * 4. Data Mutation: Functions like `handleToggleEpisode`, `updateLists`, etc., in `MainApp.tsx` would be modified to use the `updateUserData` function, which would then write changes to Firestore (e.g., using `doc.update()`).
 *
 * This change would involve removing `useLocalStorage` for user data and centralizing data management through the new `useUserData` hook connected to a backend.
 */
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