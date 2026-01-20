import { UserData, MediaUpdate, AppNotification, TmdbMediaDetails, HistoryItem } from '../types';
import { getMediaDetails, getCollectionDetails } from './tmdbService';

const STALE_THRESHOLD_DAYS = 30;

const isOneYearAgo = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false;
    const now = new Date();
    const date = new Date(dateStr);
    return now.getMonth() === date.getMonth() && 
           now.getDate() === date.getDate() && 
           now.getFullYear() > date.getFullYear();
};

export const checkForUpdates = async (userData: UserData): Promise<{ updates: MediaUpdate[], notifications: AppNotification[] }> => {
    const updates: MediaUpdate[] = [];
    const notifications: AppNotification[] = [];
    const now = new Date();

    // --- 1. Nostalgia Reminders (Plan to Watch) ---
    userData.planToWatch.forEach(item => {
        // Check if added 1 year ago today
        if (item.addedAt && isOneYearAgo(item.addedAt)) {
            updates.push({
                id: `nostalgia-added-${item.id}-${now.getFullYear()}`,
                type: 'nostalgia_added',
                mediaId: item.id,
                mediaType: item.media_type as 'tv' | 'movie',
                title: item.title,
                description: `A year ago today you marked '${item.title}' as 'plan to watch' and it hasn't been watched yet.`,
                poster_path: item.poster_path,
                timestamp: now.toISOString()
            });
        }
        
        // Check if released 1 year ago today
        if (item.release_date && isOneYearAgo(item.release_date)) {
            updates.push({
                id: `nostalgia-released-${item.id}-${now.getFullYear()}`,
                type: 'nostalgia_released',
                mediaId: item.id,
                mediaType: item.media_type as 'tv' | 'movie',
                title: item.title,
                description: `A year ago today '${item.title}' in your 'plan to watch' list was released, and you haven't watched it yet.`,
                poster_path: item.poster_path,
                timestamp: now.toISOString()
            });
        }
    });

    // --- 2. Stale Shows (Watching with no activity for 30+ days) ---
    userData.watching.forEach(item => {
        if (item.media_type !== 'tv') return;
        const lastWatched = userData.history
            .filter(h => h.id === item.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (lastWatched) {
            const lastDate = new Date(lastWatched.timestamp);
            const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays >= STALE_THRESHOLD_DAYS) {
                updates.push({
                    id: `stale-${item.id}-${now.getTime()}`,
                    type: 'stale',
                    mediaId: item.id,
                    mediaType: 'tv',
                    title: item.title,
                    description: `You haven't watched this in ${Math.floor(diffDays)} days. Ready to continue?`,
                    poster_path: item.poster_path,
                    timestamp: now.toISOString()
                });
            }
        }
    });

    // --- 3. Revivals & Sequels (Heavy TMDB checking) ---
    // We limit this to top 20 completed items to avoid rate limits
    const completedItems = [...userData.completed].slice(0, 20);
    
    for (const item of completedItems) {
        if (item.media_type === 'person') continue;

        try {
            const details = await getMediaDetails(item.id, item.media_type as 'tv' | 'movie').catch(() => null);
            if (!details) continue;
            
            if (item.media_type === 'tv') {
                const userProgress = userData.watchProgress[item.id] || {};
                const maxSeasonInHistory = Math.max(0, ...Object.keys(userProgress).map(Number));
                
                if (details.next_episode_to_air || (details.number_of_seasons && details.number_of_seasons > maxSeasonInHistory)) {
                    const desc = details.status === 'Ended' || details.status === 'Canceled' 
                        ? `This show was previously ${details.status.toLowerCase()} but has new content coming!`
                        : `New content is available for this series.`;

                    updates.push({
                        id: `revival-${item.id}-${now.getTime()}`,
                        type: 'revival',
                        mediaId: item.id,
                        mediaType: 'tv',
                        title: item.title,
                        description: desc,
                        poster_path: item.poster_path,
                        timestamp: now.toISOString(),
                        details: details.next_episode_to_air
                    });
                }
            } else if (item.media_type === 'movie' && details.belongs_to_collection) {
                const collection = await getCollectionDetails(details.belongs_to_collection.id).catch(() => null);
                if (!collection) continue;

                const sequels = (collection.parts || []).filter(part => {
                    const isWatched = userData.completed.some(c => c.id === part.id);
                    const isUpcoming = part.release_date && new Date(part.release_date) > now;
                    const isRecent = part.release_date && new Date(part.release_date) > new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                    return !isWatched && (isUpcoming || isRecent);
                });

                sequels.forEach(sequel => {
                    updates.push({
                        id: `sequel-${sequel.id}-${now.getTime()}`,
                        type: 'sequel',
                        mediaId: sequel.id,
                        mediaType: 'movie',
                        title: sequel.title || sequel.name || 'Untitled Sequel',
                        description: `A new installment in the ${collection.name} series is arriving!`,
                        poster_path: sequel.poster_path,
                        timestamp: now.toISOString(),
                        details: sequel
                    });
                });
            }
        } catch (e) {}
    }
    
    updates.forEach(update => {
        let notifType: AppNotification['type'] = 'stale_show';
        if (update.type === 'revival') notifType = 'revival';
        else if (update.type === 'sequel') notifType = 'sequel';
        else if (update.type === 'nostalgia_added') notifType = 'nostalgia_added';
        else if (update.type === 'nostalgia_released') notifType = 'nostalgia_released';

        notifications.push({
            id: `notif-${update.id}`,
            type: notifType,
            title: `Update: ${update.title}`,
            description: update.description,
            timestamp: now.toISOString(),
            read: false,
            mediaId: update.mediaId,
            mediaType: update.mediaType,
            poster_path: update.poster_path
        });
    });

    return { updates, notifications };
};
