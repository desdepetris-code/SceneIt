import { TRAKT_API_KEY, TRAKT_CLIENT_SECRET, TRAKT_REDIRECT_URI, TRAKT_API_BASE_URL } from '../constants';
import { TraktToken, TraktWatchedMovie, TraktWatchedShow, TraktWatchlistItem, TraktRating, TraktCalendarShow, TraktCalendarMovie } from '../types';

const TRAKT_TOKEN_KEY = 'trakt_token';

// --- AUTHENTICATION ---

export const redirectToTraktAuth = (): void => {
    const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${TRAKT_API_KEY}&redirect_uri=${encodeURIComponent(TRAKT_REDIRECT_URI)}`;
    window.location.href = authUrl;
};

export const exchangeCodeForToken = async (code: string, functionUrl: string): Promise<TraktToken> => {
    if (functionUrl.includes("YOUR_PROJECT_ID")) {
        throw new Error("Firebase project ID is not configured. Trakt authentication is disabled.");
    }
    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });
        if (!response.ok) {
            let errorBody = 'Cloud function error';
            try {
                const errorJson = await response.json();
                errorBody = errorJson.error || response.statusText;
            } catch (e) {
                errorBody = response.statusText;
            }
            throw new Error(`Trakt token exchange failed: ${errorBody}`);
        }
        const tokenData = await response.json();
        const token: TraktToken = {
            ...tokenData,
            created_at: Math.floor(Date.now() / 1000), // Add creation time
        };
        localStorage.setItem(TRAKT_TOKEN_KEY, JSON.stringify(token));
        return token;
    } catch (error) {
        console.error("Error exchanging Trakt code for token via cloud function:", error);
        throw error;
    }
};

export const refreshToken = async (token: TraktToken, functionUrl: string): Promise<TraktToken> => {
    if (functionUrl.includes("YOUR_PROJECT_ID")) {
        throw new Error("Firebase project ID is not configured. Trakt authentication is disabled.");
    }
    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: token.refresh_token }),
        });

        if (!response.ok) {
            clearTraktToken(); // If refresh fails, token is invalid, clear it.
            let errorBody = 'Cloud function error';
            try {
                const errorJson = await response.json();
                errorBody = errorJson.error || response.statusText;
            } catch (e) {
                errorBody = response.statusText;
            }
            throw new Error(`Failed to refresh Trakt token: ${errorBody}`);
        }
        
        const tokenData = await response.json();
        const newToken: TraktToken = {
            ...tokenData,
            created_at: Math.floor(Date.now() / 1000),
        };
        localStorage.setItem(TRAKT_TOKEN_KEY, JSON.stringify(newToken));
        return newToken;

    } catch (error) {
        console.error("Error refreshing Trakt token via cloud function:", error);
        clearTraktToken();
        throw error;
    }
};


export const getStoredToken = (): TraktToken | null => {
    const tokenStr = localStorage.getItem(TRAKT_TOKEN_KEY);
    return tokenStr ? JSON.parse(tokenStr) : null;
};

export const clearTraktToken = (): void => {
    localStorage.removeItem(TRAKT_TOKEN_KEY);
}


// --- API FETCHING ---

const fetchFromTrakt = async (endpoint: string, token: TraktToken) => {
    const url = `${TRAKT_API_BASE_URL.replace('https://', '/proxy/')}/${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`,
            'trakt-api-version': '2',
            'trakt-api-key': TRAKT_API_KEY,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch from Trakt endpoint ${endpoint}: ${response.statusText}`);
    }
    return response.json();
};

export const getWatchedShows = (token: TraktToken): Promise<TraktWatchedShow[]> => {
    return fetchFromTrakt('sync/watched/shows?extended=noseasons', token);
};

export const getWatchedMovies = (token: TraktToken): Promise<TraktWatchedMovie[]> => {
    return fetchFromTrakt('sync/watched/movies', token);
};

export const getWatchlist = (token: TraktToken): Promise<TraktWatchlistItem[]> => {
    return fetchFromTrakt('sync/watchlist', token);
};

export const getRatings = (token: TraktToken): Promise<TraktRating[]> => {
    return fetchFromTrakt('sync/ratings', token);
};

export const getShowWatchedHistory = (token: TraktToken, tmdbId: number): Promise<any> => {
    return fetchFromTrakt(`shows/${tmdbId}/history`, token);
}

// --- CALENDAR FUNCTIONS ---

export const getMyCalendarShows = (token: TraktToken, startDate: string, days: number): Promise<TraktCalendarShow[]> => {
    return fetchFromTrakt(`calendars/my/shows/${startDate}/${days}?extended=full`, token);
};

export const getAllCalendarShows = (token: TraktToken, startDate: string, days: number): Promise<TraktCalendarShow[]> => {
    return fetchFromTrakt(`calendars/all/shows/${startDate}/${days}?extended=full`, token);
};

export const getMyCalendarMovies = (token: TraktToken, startDate: string, days: number): Promise<TraktCalendarMovie[]> => {
    return fetchFromTrakt(`calendars/my/movies/${startDate}/${days}?extended=full`, token);
};

export const getAllCalendarMovies = (token: TraktToken, startDate: string, days: number): Promise<TraktCalendarMovie[]> => {
    return fetchFromTrakt(`calendars/all/movies/${startDate}/${days}?extended=full`, token);
};