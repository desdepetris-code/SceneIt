import { UserData, TmdbMediaDetails } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import { getFromCache, setToCache } from './cacheUtils';

const CACHE_KEY = 'completed_seasons_count';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const simpleHash = (data: any): number => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

export const getCompletedSeasonsCount = async (userData: UserData): Promise<number> => {
    const dataHash = simpleHash({ progress: userData.watchProgress, completed: userData.completed, watching: userData.watching });
    const cached = getFromCache<{ count: number; dataHash: number }>(CACHE_KEY);
    
    if (cached && cached.dataHash === dataHash) {
        return cached.count;
    }

    const tvShows = [...userData.watching, ...userData.completed].filter(item => item.media_type === 'tv');
    const uniqueTvShowIds = Array.from(new Set(tvShows.map(s => s.id)));

    let completedSeasons = 0;

    const allDetails: (TmdbMediaDetails | null)[] = [];
    const batchSize = 10;
    for (let i = 0; i < uniqueTvShowIds.length; i += batchSize) {
        const batch = uniqueTvShowIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => getMediaDetails(id, 'tv').catch(() => null));
        allDetails.push(...await Promise.all(batchPromises));
    }

    for (const details of allDetails) {
        if (!details || !details.seasons) continue;

        const progressForShow = userData.watchProgress[details.id];
        if (!progressForShow) continue;

        const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);

        for (const season of seasonsForCalc) {
            if (season.episode_count === 0) continue;

            let watchedCount = 0;
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status === 2) {
                    watchedCount++;
                }
            }
            if (watchedCount >= season.episode_count) {
                completedSeasons++;
            }
        }
    }
    
    setToCache(CACHE_KEY, { count: completedSeasons, dataHash }, CACHE_TTL);
    return completedSeasons;
};