import { WatchProviderResponse } from '../types';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';

/**
 * Platform Anchor Times in UTC.
 * Most streaming services drop content globally at a specific time.
 */
const PROVIDER_UTC_ANCHORS: Record<number, { hour: number; minute: number; name: string }> = {
    8:   { hour: 8,  minute: 0,  name: 'Netflix' },    // 12:00 AM PT
    15:  { hour: 5,  minute: 0,  name: 'Hulu' },       // 12:00 AM ET
    337: { hour: 8,  minute: 0,  name: 'Disney+' },    // 12:00 AM PT
    384: { hour: 7,  minute: 0,  name: 'Max' },        // 3:00 AM ET / 12:00 AM PT (Approx)
    119: { hour: 0,  minute: 0,  name: 'Prime' },      // 12:00 AM GMT (Global)
    350: { hour: 0,  minute: 0,  name: 'Apple TV+' },  // 12:00 AM GMT (Global)
    232: { hour: 8,  minute: 0,  name: 'Paramount+' }, // 12:00 AM PT
    386: { hour: 10, minute: 0,  name: 'Peacock' },    // 5:00 AM ET
};

/**
 * Estimates the local streaming release time based on the detected provider.
 * Priority: 1. Owner Overrides, 2. Platform Anchors
 */
export const estimateStreamingTime = (
    providers: WatchProviderResponse | null,
    targetTimezone: string,
    timeFormat: '12h' | '24h',
    tmdbId?: number,
    seasonEpisodeKey?: string // e.g. "S1E1"
): { time: string; provider: string } | null => {
    
    // --- 1. PRIORITY: OWNER OVERRIDES ---
    if (tmdbId && AIRTIME_OVERRIDES[tmdbId]) {
        const override = AIRTIME_OVERRIDES[tmdbId];
        
        // Check for specific episode override first
        // Added comment above fix: Accessing 'time' property which is now optional in AIRTIME_OVERRIDES interface
        let timeToUse: string | undefined = override.time;
        if (seasonEpisodeKey && override.episodes?.[seasonEpisodeKey]) {
            timeToUse = override.episodes[seasonEpisodeKey];
        }

        if (!timeToUse) return null;

        // If the override is already a descriptive string (contains spaces or letters), return it directly
        if (timeToUse.includes(' ') || /[a-zA-Z]/.test(timeToUse)) {
            return { time: timeToUse, provider: override.provider };
        }

        // Defensive check: ensure timeToUse is valid before split
        const parts = timeToUse.split(':');
        if (parts.length < 2) return null;

        const [hours, minutes] = parts.map(Number);
        
        // Create a date in local time for today
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

        const localTimeStr = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: timeFormat === '12h',
            timeZone: targetTimezone
        }).format(localDate);

        return { time: localTimeStr, provider: override.provider };
    }

    // --- 2. FALLBACK: PLATFORM ANCHORS ---
    const usFlatrate = providers?.results?.US?.flatrate;
    if (!usFlatrate || usFlatrate.length === 0) return null;

    // Sort to find the most "reliable" streamer in our anchor list
    const sorted = [...usFlatrate].sort((a, b) => {
        const aKnown = PROVIDER_UTC_ANCHORS[a.provider_id] ? 1 : 0;
        const bKnown = PROVIDER_UTC_ANCHORS[b.provider_id] ? 1 : 0;
        return bKnown - aKnown;
    });

    const bestMatch = sorted[0];
    const config = PROVIDER_UTC_ANCHORS[bestMatch.provider_id];

    if (!config) {
        return { time: '12:00 AM', provider: bestMatch.provider_name };
    }

    // Create a dummy date for today at the UTC anchor time
    const now = new Date();
    const utcDate = new Date(Date.UTC(
        now.getUTCFullYear(), 
        now.getUTCMonth(), 
        now.getUTCDate(), 
        config.hour, 
        config.minute
    ));

    // Convert to local string based on user's timezone and format
    const localTimeStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: timeFormat === '12h',
        timeZone: targetTimezone
    }).format(utcDate);

    return { time: localTimeStr, provider: config.name };
};