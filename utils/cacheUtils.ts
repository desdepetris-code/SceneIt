// utils/cacheUtils.ts

/**
 * Keys that should NEVER be deleted by the automated cache cleaner.
 * These represent user-created content and essential show metadata.
 */
const PROTECTED_PREFIXES = [
    'watching_list_', 'plan_to_watch_list_', 'completed_list_', 
    'on_hold_list_', 'dropped_list_', 'all_caught_up_list_', 
    'favorites_list_', 'watch_progress_', 'history_', 
    'deleted_history_', 'deleted_notes_', 'search_history_', 
    'comments_', 'media_notes_', 'episode_notes_', 
    'custom_image_paths_', 'custom_episode_images_', 
    'notifications_', 'favorite_episodes_', 'episode_ratings_', 
    'season_ratings_', 'custom_lists_', 'user_ratings_', 
    'profilePictureUrl_', 'reminders_', 'globalPlaceholders_', 
    'notification_settings_', 'manual_presets_', 
    'shortcut_settings_', 'nav_settings_', 'app_preferences_', 
    'privacy_settings_', 'holidayAnimationsEnabled_', 
    'profileTheme_', 'timezone_', 'userXp_', 'showRatings_',
    'weekly_favorites_', 'weekly_favorites_week_', 'weekly_favorites_history_',
    'currentUser', 'themeId', 'autoHolidayThemesEnabled_', 'sceneit_users',
    // ADDED: Core Show/Movie Metadata is now strictly protected. 
    // It will not be deleted by the automatic cleanup.
    'tmdb_details_v4_'
];

/**
 * Checks if an error is a LocalStorage quota exceeded error.
 */
const isQuotaExceededError = (e: unknown): boolean => {
    return (
        e instanceof DOMException &&
        (e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
};

/**
 * Surgical cleanup using LRU logic.
 * Only targets secondary metadata (credits, providers, trending lists).
 */
const cleanCacheLRU = (): void => {
    try {
        const cacheItems: { key: string; lastAccessed: number }[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            // Skip protected user data and CORE show info
            if (PROTECTED_PREFIXES.some(prefix => key.startsWith(prefix))) continue;

            try {
                const itemStr = localStorage.getItem(key);
                if (itemStr) {
                    const item = JSON.parse(itemStr);
                    if (item && item.expiry) {
                        cacheItems.push({ 
                            key, 
                            lastAccessed: item.lastAccessed || 0 
                        });
                    }
                }
            } catch (e) {
                // Not a JSON item, skip
            }
        }
        
        // Sort by oldest access time
        cacheItems.sort((a, b) => a.lastAccessed - b.lastAccessed);
        
        // Remove only the oldest 30% of secondary metadata
        const itemsToRemoveCount = Math.ceil(cacheItems.length * 0.30);
        for (let i = 0; i < itemsToRemoveCount; i++) {
            localStorage.removeItem(cacheItems[i].key);
        }
        
        console.log(`Cache: LRU cleanup cleared ${itemsToRemoveCount} secondary metadata items.`);
    } catch (e) {
        console.error("An error occurred during cache cleanup:", e);
    }
};

/**
 * Manually triggered cleanup for secondary API metadata.
 * Users can run this in Settings if they need to free up space.
 */
export const clearAllApiCache = (isAuto = true): void => {
    if (!isAuto && !window.confirm("This will clear secondary data like cast lists and streaming providers. Show titles and watch history are safe. Continue?")) {
        return;
    }
    
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            // Only target non-core metadata
            const isPurgeable = key.startsWith('tmdb_providers_') || 
                               key.startsWith('tmdb_agg_credits_') || 
                               key.startsWith('tmdb_trending_') ||
                               key.startsWith('tmdb_discover_') ||
                               key.startsWith('trakt_trending_');

            if (isPurgeable) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        if (!isAuto) window.location.reload();
    } catch (e) {
        console.error("Failed to purge secondary cache.", e);
    }
};

/**
 * Retrieves an item from the cache, checking for expiration.
 */
export const getFromCache = <T,>(key: string): T | null => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  try {
    const item = JSON.parse(itemStr);
    if (new Date().getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    // Refresh lastAccessed
    const updatedItem = { ...item, lastAccessed: new Date().getTime() };
    try {
        localStorage.setItem(key, JSON.stringify(updatedItem));
    } catch(e) {}
    
    return item.value;
  } catch (error) {
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * Sets an item in cache. Refuses to save if the item itself is too large.
 */
export const setToCache = <T,>(key: string, value: T, ttl: number): void => {
    const now = new Date().getTime();
    const item = {
        value: value,
        expiry: now + ttl,
        lastAccessed: now
    };
    
    const serialized = JSON.stringify(item);

    // Safety: If the item itself is larger than 2MB, don't even try.
    // LocalStorage usually has a 5MB limit per domain.
    if (serialized.length > 2000000) {
        console.warn(`Object for ${key} is too large (${Math.round(serialized.length / 1024)}KB). Skipping cache.`);
        return;
    }

    try {
        localStorage.setItem(key, serialized);
    } catch (e) {
        if (isQuotaExceededError(e)) {
            cleanCacheLRU();
            try {
                localStorage.setItem(key, serialized);
            } catch (retryError) {
                // If it still fails, it's either a massive individual object or the protected data is filling the disk.
                console.error(`Final cache failure for ${key}. Storage may be full of user history or core data.`);
            }
        }
    }
};
