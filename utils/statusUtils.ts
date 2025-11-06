import { TmdbMediaDetails } from '../types';

export const getShowStatus = (details: TmdbMediaDetails): { text: string; date?: string } | null => {
    if (details.media_type !== 'tv' || !details.status) return null;

    // --- Final Statuses ---
    if (details.status === 'Ended') return { text: 'Ended' };
    if (details.status === 'Canceled') return { text: 'Canceled' };

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // --- Upcoming Series that has never aired ---
    // new Date('YYYY-MM-DD') parses as UTC midnight.
    if (details.first_air_date && new Date(details.first_air_date) > todayUTC && !details.last_episode_to_air) {
        return { text: 'Upcoming', date: details.first_air_date };
    }

    const nextEp = details.next_episode_to_air;
    const lastEp = details.last_episode_to_air;

    // --- Logic for shows with a scheduled next episode ---
    if (nextEp?.air_date) {
        const nextAirDate = new Date(nextEp.air_date); // YYYY-MM-DD is parsed as UTC midnight
        
        if (nextAirDate >= todayUTC) {
            // Check for mid-season break (more than 2 weeks between episodes)
            if (lastEp?.air_date) {
                const lastAirDate = new Date(lastEp.air_date);
                const diffInMs = nextAirDate.getTime() - lastAirDate.getTime();
                const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

                if (diffInDays > 14) {
                    return { text: 'Upcoming', date: nextEp.air_date };
                }
            }
            
            // Check if it's a new season premiere
            if (nextEp.episode_number === 1) {
                return { text: 'Upcoming', date: nextEp.air_date };
            }

            // Otherwise, it's a regular weekly-ish release, so it's "In Season"
            return { text: 'In Season', date: nextEp.air_date };
        }
    }
    
    // --- Logic for shows without a scheduled next episode ---
    if (details.status === 'Returning Series') {
        // Use getRenewalStatus to see if we can infer a future season
        const renewalInfo = getRenewalStatus(details);
        if (renewalInfo) {
            // If we have a renewal and a specific date, it's Upcoming.
            if (renewalInfo.date) {
                return { text: 'Upcoming', date: renewalInfo.date };
            }
            // If it's renewed but has no date, it's on hiatus.
            return { text: 'On Hiatus' };
        }
        // It's a returning series, but we have no info on the next season
        return { text: 'On Hiatus' };
    }
    
    // Fallback for other non-ended statuses
    if (details.status === 'In Production' || details.status === 'Pilot') {
        return { text: 'In Production' };
    }

    // Default to 'On Hiatus' if no other condition is met (e.g., status is "Continuing" but no next episode)
    return { text: 'On Hiatus' };
};

export const getRenewalStatus = (details: TmdbMediaDetails): { text: string; date?: string } | null => {
    if (details.media_type !== 'tv' || !details.status || details.status === 'Ended' || details.status === 'Canceled') {
        return null;
    }

    const lastSeasonInArray = [...(details.seasons || [])]
        .filter(s => s.season_number > 0)
        .sort((a, b) => b.season_number - a.season_number)[0];
        
    const lastAiredSeasonNumber = details.last_episode_to_air?.season_number;

    let renewalText: string | null = null;
    let renewalDate: string | undefined = undefined;

    // Infer from seasons array if a season object exists for a season after the last aired one
    if (lastSeasonInArray && lastAiredSeasonNumber && lastSeasonInArray.season_number > lastAiredSeasonNumber) {
        const nextSeason = details.seasons?.find(s => s.season_number === lastAiredSeasonNumber + 1);
        if (nextSeason) {
            renewalText = `Renewed for Season ${nextSeason.season_number}`;
            renewalDate = nextSeason.air_date || undefined;
        }
    }
    
    // Infer from 'Returning Series' status if no unaired season object is present
    if (!renewalText && details.status === 'Returning Series' && !details.next_episode_to_air && lastAiredSeasonNumber && lastSeasonInArray?.season_number === lastAiredSeasonNumber) {
        renewalText = `Renewed for Season ${lastAiredSeasonNumber + 1}`;
    }

    if (renewalText) {
        // Now check if it's the final season
        let isFinal = false;
        const finalKeywords = ['final season', 'concluding season', 'last season'];
        
        // Check show overview for keywords
        if (details.overview && finalKeywords.some(keyword => details.overview!.toLowerCase().includes(keyword))) {
            isFinal = true;
        }

        // Check the name of the last known season in the array. This could be the upcoming final season.
        if (!isFinal && lastSeasonInArray?.name) {
            if (finalKeywords.some(keyword => lastSeasonInArray.name.toLowerCase().includes(keyword))) {
                isFinal = true;
            }
        }
        
        if (isFinal) {
            renewalText += " (Final Season)";
        }

        return { text: renewalText, date: renewalDate };
    }
    
    return null;
};