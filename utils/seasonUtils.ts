import { UserData } from '../types';
import { getMediaDetails } from '../services/tmdbService';

export const getCompletedSeasonsCount = async (userData: UserData): Promise<number> => {
    const tvShows = [...userData.watching, ...userData.completed].filter(item => item.media_type === 'tv');
    const uniqueTvShowIds = Array.from(new Set(tvShows.map(s => s.id)));

    let completedSeasons = 0;

    const detailPromises = uniqueTvShowIds.map(id => getMediaDetails(id, 'tv').catch(() => null));
    const allDetails = await Promise.all(detailPromises);

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
    
    return completedSeasons;
};
