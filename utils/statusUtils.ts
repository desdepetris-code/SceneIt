import { TmdbMediaDetails } from '../types';

export const getShowStatus = (details: TmdbMediaDetails): { text: string; date?: string } | null => {
    if (details.media_type !== 'tv' || !details.status) return null;

    // 1. Ended or Canceled (Highest priority)
    if (details.status === 'Ended') return { text: 'Status: Ended' };
    if (details.status === 'Canceled') return { text: 'Status: Canceled' };

    const now = new Date();
    const lastEp = details.last_episode_to_air;
    const nextEp = details.next_episode_to_air;
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    if (nextEp?.air_date) {
        const nextAirDate = new Date(`${nextEp.air_date}T00:00:00Z`);

        if (nextAirDate > now) {
            // "in season" if next episode is within a week
            if (nextAirDate <= oneWeekFromNow) {
                return { text: 'Status: Ongoing: in season', date: nextEp.air_date };
            }
            // "Upcoming" for any future episode more than a week away
            return { text: 'Status: Upcoming', date: nextEp.air_date };
        }
    }

    // If no future episode is scheduled
    if (lastEp?.air_date) {
        const lastAirDate = new Date(`${lastEp.air_date}T00:00:00Z`);
        // Undetermined if last episode was over a year ago
        if (lastAirDate < oneYearAgo) {
            return { text: 'Status: Undetermined' };
        }
    }
    
    // If not in season, not upcoming, but is a returning series, it's on hiatus
    if (['Returning Series', 'In Production', 'Pilot'].includes(details.status)) {
        return { text: 'Status: On Hiatus' };
    }

    // Default case for shows without enough info
    return null;
};