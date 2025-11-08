// data/showAchievements.ts
import { TmdbMediaDetails, UserData } from '../types';

export interface ShowAchievement {
  id: string;
  name: string;
  description: string;
  category: 'Progress' | 'Engagement' | 'Community';
  check: (
    details: TmdbMediaDetails,
    userData: UserData
  ) => { unlocked: boolean; unlockDate: string | null };
}

// Helper to find the latest timestamp for a set of episodes
const findLatestTimestamp = (
  history: UserData['history'],
  showId: number,
  episodes: { season: number; episode: number }[]
): string | null => {
  let latestTimestamp = 0;
  const episodeKeys = new Set(
    episodes.map((ep) => `${ep.season}-${ep.episode}`)
  );

  history.forEach((h) => {
    if (h.id === showId && episodeKeys.has(`${h.seasonNumber}-${h.episodeNumber}`)) {
      const timestamp = new Date(h.timestamp).getTime();
      if (timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
      }
    }
  });

  return latestTimestamp > 0 ? new Date(latestTimestamp).toISOString() : null;
};

export const showAchievements: ShowAchievement[] = [
  // --- Progress ---
  {
    id: 'movie_night',
    name: 'Movie Night',
    description: 'Watched this movie.',
    category: 'Progress',
    check: (details, userData) => {
        if (details.media_type !== 'movie') return { unlocked: false, unlockDate: null };
        const isCompleted = userData.completed.some(item => item.id === details.id);
        if (!isCompleted) return { unlocked: false, unlockDate: null };
        
        const historyEntry = userData.history.find(h => h.id === details.id);
        return { unlocked: true, unlockDate: historyEntry?.timestamp || null };
    },
  },
  {
    id: 'pilot_watcher',
    name: 'Pilot Watcher',
    description: 'Watched the first episode.',
    category: 'Progress',
    check: (details, userData) => {
        if (details.media_type !== 'tv') return { unlocked: false, unlockDate: null };
        const isWatched = userData.watchProgress[details.id]?.[1]?.[1]?.status === 2;
        if (!isWatched) return { unlocked: false, unlockDate: null };

        const unlockDate = findLatestTimestamp(userData.history, details.id, [{ season: 1, episode: 1 }]);
        return { unlocked: true, unlockDate };
    },
  },
  {
    id: 'season_1_finisher',
    name: 'Season One Complete',
    description: 'Finished all episodes in Season 1.',
    category: 'Progress',
    check: (details, userData) => {
        if (details.media_type !== 'tv') return { unlocked: false, unlockDate: null };
        const season1 = details.seasons?.find(s => s.season_number === 1);
        if (!season1 || season1.episode_count === 0) return { unlocked: false, unlockDate: null };
        
        const episodesToCheck: { season: number; episode: number }[] = [];
        for (let i = 1; i <= season1.episode_count; i++) {
            if (userData.watchProgress[details.id]?.[1]?.[i]?.status !== 2) {
                return { unlocked: false, unlockDate: null };
            }
            episodesToCheck.push({ season: 1, episode: i });
        }
        
        const unlockDate = findLatestTimestamp(userData.history, details.id, episodesToCheck);
        return { unlocked: true, unlockDate };
    },
  },
    {
    id: 'halfway_there',
    name: 'Halfway There',
    description: 'Completed 50% of all available episodes.',
    category: 'Progress',
    check: (details, userData) => {
      if (details.media_type !== 'tv' || !details.number_of_episodes || details.number_of_episodes === 0) return { unlocked: false, unlockDate: null };
      
      const totalEpisodes = details.number_of_episodes;
      let watchedCount = 0;
      const progress = userData.watchProgress[details.id];
      if (progress) {
        Object.values(progress).forEach(season => {
          watchedCount += Object.values(season).filter(ep => ep.status === 2).length;
        });
      }

      const unlocked = watchedCount >= totalEpisodes / 2;
      return { unlocked, unlockDate: unlocked ? new Date().toISOString() : null }; // Date is tricky here, so we fake it for now.
    },
  },
  {
    id: 'series_finale',
    name: 'Series Binge',
    description: 'Completed every episode of the show.',
    category: 'Progress',
    check: (details, userData) => {
        if (details.media_type !== 'tv' || details.status !== 'Ended' || !details.number_of_episodes) return { unlocked: false, unlockDate: null };

        let watchedCount = 0;
        const progress = userData.watchProgress[details.id];
        if (progress) {
            Object.values(progress).forEach(season => {
                watchedCount += Object.values(season).filter(ep => ep.status === 2).length;
            });
        }
        
        if (watchedCount >= details.number_of_episodes) {
             const historyEntry = userData.history.find(h => h.id === details.id); // Not perfect but a good guess
             return { unlocked: true, unlockDate: historyEntry?.timestamp || null };
        }
        return { unlocked: false, unlockDate: null };
    },
  },
  // --- Engagement ---
  {
    id: 'first_rating',
    name: 'Rated It',
    description: 'You gave this a rating.',
    category: 'Engagement',
    check: (details, userData) => {
        const rating = userData.ratings[details.id];
        return { unlocked: !!rating, unlockDate: rating?.date || null };
    },
  },
  {
    id: 'first_favorite',
    name: 'A True Favorite',
    description: 'You added this to your Favorites.',
    category: 'Engagement',
    check: (details, userData) => {
        const isFavorite = userData.favorites.some(f => f.id === details.id);
        return { unlocked: isFavorite, unlockDate: isFavorite ? new Date().toISOString() : null }; // Can't get date for this easily
    },
  },
   {
    id: 'list_curator',
    name: 'Curator',
    description: 'Added to a custom list.',
    category: 'Engagement',
    check: (details, userData) => {
      const isInList = userData.customLists.some(list => list.items.some(item => item.id === details.id));
      return { unlocked: isInList, unlockDate: null }; // No timestamp for this action
    },
  },
  {
    id: 'episode_rater',
    name: 'Episode Critic',
    description: 'Rated an individual episode.',
    category: 'Engagement',
    check: (details, userData) => {
        if (details.media_type !== 'tv') return { unlocked: false, unlockDate: null };
        const hasRating = Object.values(userData.episodeRatings[details.id] || {}).some(season => Object.keys(season).length > 0);
        return { unlocked: hasRating, unlockDate: null };
    },
  },
  // --- Community ---
  {
    id: 'first_comment',
    name: 'First Comment',
    description: 'Left a comment on the main page.',
    category: 'Community',
    check: (details, userData) => {
        const mediaKey = `${details.media_type}-${details.id}`;
        const comment = userData.comments.find(c => c.mediaKey === mediaKey);
        return { unlocked: !!comment, unlockDate: comment?.timestamp || null };
    },
  },
   {
    id: 'episode_commentator',
    name: 'Episode Commentator',
    description: 'Commented on an episode.',
    category: 'Community',
    check: (details, userData) => {
      if (details.media_type !== 'tv') return { unlocked: false, unlockDate: null };
      const prefix = `tv-${details.id}-s`;
      const comment = userData.comments.find(c => c.mediaKey.startsWith(prefix) && c.mediaKey.includes('-e'));
      return { unlocked: !!comment, unlockDate: comment?.timestamp || null };
    },
  },
];
