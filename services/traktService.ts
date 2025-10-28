
import { TRAKT_API_KEY, TRAKT_CLIENT_SECRET, TRAKT_REDIRECT_URI, TRAKT_API_BASE_URL } from '../constants';
import { TraktToken, TraktWatchedMovie, TraktWatchedShow, TraktWatchlistItem, TraktRating } from '../types';

const TRAKT_TOKEN_KEY = 'trakt_token';

// --- AUTHENTICATION ---

export const redirectToTraktAuth = (): void => {
    const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${TRAKT_API_KEY}&redirect_uri=${encodeURIComponent(TRAKT_REDIRECT_URI)}`;
    window.location.href = authUrl;
};

export const exchangeCodeForToken = async (code: string): Promise<TraktToken> => {
    try {
        const url = `${TRAKT_API_BASE_URL.replace('https://', '/proxy/')}/oauth/token`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                client_id: TRAKT_API_KEY,
                client_secret: TRAKT_CLIENT_SECRET, // SECURITY: Not for production client-side apps.
                redirect_uri: TRAKT_REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });
        if (!response.ok) {
            let errorBody = 'Unknown error';
            try {
                const errorJson = await response.json();
                errorBody = errorJson.error_description || response.statusText;
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
        console.error("Error exchanging Trakt code for token:", error);
        throw error;
    }
};

export const refreshToken = async (token: TraktToken): Promise<TraktToken> => {
    try {
        const url = `${TRAKT_API_BASE_URL.replace('https://', '/proxy/')}/oauth/token`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refresh_token: token.refresh_token,
                client_id: TRAKT_API_KEY,
                client_secret: TRAKT_CLIENT_SECRET,
                redirect_uri: TRAKT_REDIRECT_URI,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            clearTraktToken(); // If refresh fails, token is invalid, clear it.
            let errorBody = 'Unknown error';
            try {
                const errorJson = await response.json();
                errorBody = errorJson.error_description || response.statusText;
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
        console.error("Error refreshing Trakt token:", error);
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
    const response = await fetch(`${TRAKT_API_BASE_URL}/${endpoint}`, {
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