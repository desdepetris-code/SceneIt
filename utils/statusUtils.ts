import { TmdbMediaDetails } from '../types';

export const getShowStatus = (details: TmdbMediaDetails): { text: string; date?: string } | null => {
    if (details.media_type !== 'tv' || !details.status) return null;

    if (details.status === 'Ended') return { text: 'Status: Ended' };
    if (details.status === 'Canceled') return { text: 'Status: Canceled' };

    const now = new Date();
    const lastEp = details.last_episode_to_air;
    const nextEp = details.next_episode_to_air;
    
    // If there's a next episode with a valid air date
    if (nextEp?.air_date) {
        const nextAirDate = new Date(`${nextEp.air_date}T00:00:00Z`);
        if (nextAirDate > now) {
            // Episode is in the future.
            // Has the show started yet? (i.e., has a previous episode aired?)
            if (lastEp?.air_date && new Date(`${lastEp.air_date}T00:00:00Z`) < now) {
                // Yes, it started. So it's currently airing but next ep is in future.
                return { text: 'Status: Ongoing: in season', date: nextEp.air_date };
            } else {
                // No last episode, or last episode is also in future. It's an upcoming show/season.
                return { text: 'Status: Upcoming Season', date: nextEp.air_date };
            }
        } else {
            // Next episode air date is today or in the past. It's definitely in season.
            return { text: 'Status: Ongoing: in season', date: nextEp.air_date };
        }
    }

    // If there's NO next episode, but it's a returning series
    if (details.status === 'Returning Series' || details.status === 'In Production' || details.status === 'Pilot') {
         if (lastEp?.air_date) {
            const lastAirDate = new Date(`${lastEp.air_date}T00:00:00Z`);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            if (lastAirDate < oneYearAgo) {
                return { text: 'Status: Undetermined' };
            }
        }
        return { text: 'Status: Ongoing: off season' };
    }
    
    // TMDB status 'Planned' can be considered Undetermined
    if (details.status === 'Planned') {
        return { text: 'Status: Undetermined' };
    }

    // Fallback for any other unhandled statuses
    return null;
}