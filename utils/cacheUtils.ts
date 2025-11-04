// utils/cacheUtils.ts

/**
 * Checks if an error is a LocalStorage quota exceeded error.
 * @param e The error object.
 * @returns True if it's a quota error, false otherwise.
 */
const isQuotaExceededError = (e: unknown): boolean => {
    return (
        e instanceof DOMException &&
        // Covers most browsers
        (e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
};

/**
 * Clears a portion of the cache to make space.
 * It identifies cache items by looking for an 'expiry' property.
 * It removes the oldest 50% of items.
 */
const cleanCache = (): void => {
    try {
        const cacheItems: { key: string; expiry: number }[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                try {
                    const itemStr = localStorage.getItem(key);
                    if (itemStr) {
                        const item = JSON.parse(itemStr);
                        // Identify our cache items by the presence of an expiry timestamp
                        if (item && typeof item.expiry === 'number') {
                            cacheItems.push({ key, expiry: item.expiry });
                        }
                    }
                } catch (e) {
                    // Ignore items that are not valid JSON or don't match our structure
                }
            }
        }
        
        // Sort by expiry date, oldest first
        cacheItems.sort((a, b) => a.expiry - b.expiry);
        
        // Determine how many items to remove (50% of the cache)
        const itemsToRemoveCount = Math.ceil(cacheItems.length * 0.50);
        
        if (itemsToRemoveCount > 0) {
            console.log(`Cache is full. Clearing ${itemsToRemoveCount} oldest items to make space.`);
            for (let i = 0; i < itemsToRemoveCount; i++) {
                localStorage.removeItem(cacheItems[i].key);
            }
        }

    } catch (e) {
        console.error("An error occurred during cache cleanup:", e);
    }
};

/**
 * Manually clears all TMDB and TVDB API cache from LocalStorage.
 */
export const clearApiCache = (): void => {
    const confirmationMessage = "This will clear all cached movie, show, and person data from your device, forcing the app to fetch fresh information from the servers. Your personal data (watch history, lists, settings, etc.) will NOT be affected. Do you want to continue?";
    if (window.confirm(confirmationMessage)) {
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('tmdb_') || key.startsWith('tvdb_'))) {
                    keysToRemove.push(key);
                }
            }
            
            if (keysToRemove.length > 0) {
                console.log(`Clearing ${keysToRemove.length} API cache items.`);
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
                alert('API cache cleared successfully! The app will now reload.');
                window.location.reload();
            } else {
                alert('API cache is already empty.');
            }

        } catch (e) {
            console.error("An error occurred during manual cache clearing:", e);
            alert('An error occurred while clearing the cache.');
        }
    }
};


/**
 * Retrieves an item from the cache, checking for expiration.
 * @param key The key of the item to retrieve.
 * @returns The cached value or null if not found or expired.
 */
export const getFromCache = <T,>(key: string): T | null => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return null;
  }
  try {
    const item = JSON.parse(itemStr);
    const now = new Date();
    // Check if item has expired
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (error) {
    console.error("Error reading from cache", error);
    // Remove potentially corrupted item
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Sets an item in the cache with a specific Time-To-Live (TTL).
 * If the cache is full, it will attempt to clean it and retry.
 * @param key The key to store the value under.
 * @param value The value to store.
 * @param ttl The TTL for the item in milliseconds.
 */
export const setToCache = <T,>(key: string, value: T, ttl: number): void => {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    try {
        localStorage.setItem(key, JSON.stringify(item));
        // On any successful write, we can assume the storage isn't critical anymore.
        localStorage.removeItem('sceneit_storage_critical');
    } catch (e) {
        if (isQuotaExceededError(e)) {
            console.warn("LocalStorage quota exceeded. Attempting to clean cache...");
            cleanCache();
            // Retry setting the item once after cleaning
            try {
                localStorage.setItem(key, JSON.stringify(item));
                console.log("Successfully set item after cache cleanup.");
                // If successful, the critical state is over.
                localStorage.removeItem('sceneit_storage_critical');
            } catch (retryError) {
                 if (isQuotaExceededError(retryError)) {
                    console.error("Failed to set cache item even after cleaning. The data might be too large or the cache is still full.", retryError);
                    // Set critical flag to trigger UI warning
                    localStorage.setItem('sceneit_storage_critical', 'true');
                 }
            }
        } else {
            console.error("An unexpected error occurred while setting cache:", e);
        }
    }
};