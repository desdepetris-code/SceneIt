import { TmdbMediaDetails, WatchProgress, WatchStatus, EpisodeProgress } from '../types';
import { getAiredEpisodeCount } from './formatUtils';

/**
 * Determines the correct automated status for a TV show based on progress and airing details.
 * Following the SceneIt core logic rules.
 */
export const calculateAutoStatus = (
    details: TmdbMediaDetails, 
    progress: WatchProgress[number] = {}
): WatchStatus | null => {
    if (details.media_type !== 'tv') {
        // For movies, it's simpler: it's either in a list or not.
        // Usually handled by manual status or 'completed' if marked watched.
        return null;
    }

    let totalWatched = 0;
    Object.values(progress).forEach(season => {
        Object.values(season).forEach(ep => {
            if ((ep as EpisodeProgress).status === 2) totalWatched++;
        });
    });

    if (totalWatched === 0) return null;

    const totalAired = getAiredEpisodeCount(details);
    const totalInShow = details.number_of_episodes || 0;

    // Rule B: Completed
    if ((details.status === 'Ended' || details.status === 'Canceled') && totalWatched >= totalInShow) {
        return 'completed';
    }

    // Rule C: All Caught Up
    if (details.status !== 'Ended' && details.status !== 'Canceled' && totalWatched >= totalAired) {
        return 'allCaughtUp';
    }

    // Rule A: Watching
    return 'watching';
};

/**
 * Returns true if the status is one of the three statuses chosen manually by the user.
 */
export const isManualStatus = (status: WatchStatus | null): boolean => {
    return status === 'planToWatch' || status === 'onHold' || status === 'dropped';
};