// services/traktService.ts
import { TRAKT_API_BASE_URL, TRAKT_API_KEY, TRAKT_CLIENT_SECRET, TRAKT_REDIRECT_URI } from '../constants';
import { TraktHistoryItem, TraktTokenResponse } from '../types';

// Redirect user to Trakt's authorization page
export const redirectToTraktOauth = () => {
    const authUrl = new URL(`${TRAKT_API_BASE_URL}/oauth/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', TRAKT_API_KEY);
    authUrl.searchParams.set('redirect_uri', TRAKT_REDIRECT_URI);
    window.location.href = authUrl.toString();
};

// Exchange authorization code for an access token
export const exchangeCodeForToken = async (code: string): Promise<TraktTokenResponse> => {
    const response = await fetch(`${TRAKT_API_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code: code,
            client_id: TRAKT_API_KEY,
            client_secret: TRAKT_CLIENT_SECRET,
            redirect_uri: TRAKT_REDIRECT_URI,
            grant_type: 'authorization_code',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange Trakt authorization code for a token.');
    }

    const tokenData: TraktTokenResponse = await response.json();
    return tokenData;
};

// Revoke the access token (disconnect)
export const revokeTraktToken = async (accessToken: string): Promise<void> => {
    await fetch(`${TRAKT_API_BASE_URL}/oauth/revoke`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: accessToken,
            client_id: TRAKT_API_KEY,
            client_secret: TRAKT_CLIENT_SECRET,
        }),
    });
};


// Fetch watch history using a valid access token
export const getAuthenticatedTraktWatchHistory = async (accessToken: string): Promise<TraktHistoryItem[]> => {
    const url = `${TRAKT_API_BASE_URL}/sync/history?limit=5000`; // High limit to get most of the history
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': TRAKT_API_KEY,
            'Authorization': `Bearer ${accessToken}`,
        },
    };
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error('Failed to fetch authenticated watch history from Trakt.');
    }

    const data: TraktHistoryItem[] = await response.json();
    
    // Filter for valid items that have a TMDB ID we can use
    return data.filter(item => {
        if (item.type === 'movie') {
            return !!item.movie?.ids?.tmdb;
        }
        if (item.type === 'episode') {
            return !!item.show?.ids?.tmdb && !!item.episode;
        }
        return false;
    });
};