import { TVDB_API_KEY, TVDB_API_BASE_URL } from '../constants';
import { TvdbToken, TvdbShow, TvdbRelatedShow } from '../types';
import { getFromCache, setToCache } from '../utils/cacheUtils';

const TVDB_TOKEN_KEY = 'tvdb_token';
const TOKEN_REFRESH_MARGIN = 28 * 24 * 60 * 60 * 1000; // 28 days in milliseconds
const TVDB_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// --- Authentication & Token Management ---
const getTvdbToken = async (): Promise<string> => {
    const storedTokenStr = localStorage.getItem(TVDB_TOKEN_KEY);
    if (storedTokenStr) {
        try {
            const storedToken: TvdbToken = JSON.parse(storedTokenStr);
            if (storedToken.expiry > Date.now()) {
                return storedToken.token;
            }
        } catch (e) {
            console.error("Failed to parse stored TVDB token", e);
        }
    }

    // If no valid token, fetch a new one
    // The TVDB API does not support CORS for client-side requests.
    // Use the platform's proxy to bypass this limitation for the login endpoint.
    const proxyUrl = `${TVDB_API_BASE_URL.replace('https://', '/proxy/')}/login`;
    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            apikey: TVDB_API_KEY,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to authenticate with TVDB API');
    }

    const { data } = await response.json();
    const newToken: TvdbToken = {
        token: data.token,
        expiry: Date.now() + TOKEN_REFRESH_MARGIN,
    };

    localStorage.setItem(TVDB_TOKEN_KEY, JSON.stringify(newToken));
    return newToken.token;
};

// --- Generic Fetcher ---
const fetchFromTvdb = async <T,>(endpoint: string): Promise<T> => {
    const token = await getTvdbToken();
    // The TVDB API does not support CORS for client-side requests.
    // Use the platform's proxy to bypass this limitation for all data fetching endpoints.
    const url = `${TVDB_API_BASE_URL.replace('https://', '/proxy/')}/${endpoint}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TVDB API Error: ${errorData.message || 'Failed to fetch'}`);
    }

    const { data } = await response.json();
    return data;
};

// --- API Methods ---

/**
 * Fetches extended details for a TV show from TVDB, including characters.
 * @param tvdbId The TVDB series ID.
 * @returns A promise that resolves to the TVDB show details.
 */
export const getTvdbShowExtended = async (tvdbId: number): Promise<TvdbShow> => {
    const cacheKey = `tvdb_details_v1_${tvdbId}`;
    const cachedData = getFromCache<TvdbShow>(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    
    const data = await fetchFromTvdb<TvdbShow>(`series/${tvdbId}/extended`);
    setToCache(cacheKey, data, TVDB_CACHE_TTL);
    return data;
};

export const getTvdbRelatedShows = async (tvdbId: number): Promise<TvdbRelatedShow[]> => {
    const cacheKey = `tvdb_relations_v1_${tvdbId}`;
    const cachedData = getFromCache<TvdbRelatedShow[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const data = await fetchFromTvdb<{ relations: TvdbRelatedShow[] }>(`series/${tvdbId}/relations`);
    const relations = data.relations || [];
    setToCache(cacheKey, relations, TVDB_CACHE_TTL);
    return relations;
};

export const getSeriesAllEpisodes = async (tvdbId: number): Promise<any[]> => {
    const cacheKey = `tvdb_episodes_all_${tvdbId}`;
    const cachedData = getFromCache<any[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    let allEpisodes: any[] = [];
    let page = 0;
    let hasMorePages = true;

    while (hasMorePages) {
        try {
            const data = await fetchFromTvdb<any>(`series/${tvdbId}/episodes/default?page=${page}`);
            // For page 0, episodes are in data.episodes. For page > 0, data is the episodes array.
            const episodes = (page === 0 && data.episodes) ? data.episodes : (Array.isArray(data) ? data : null);

            if (episodes && episodes.length > 0) {
                allEpisodes.push(...episodes);
                page++;
            } else {
                hasMorePages = false;
            }
        } catch (error: any) {
            // Assuming 404 from fetchFromTvdb wrapper means no more pages.
            hasMorePages = false;
        }
    }

    setToCache(cacheKey, allEpisodes, TVDB_CACHE_TTL);
    return allEpisodes;
};