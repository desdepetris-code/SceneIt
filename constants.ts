// TMDB API Key. For a production app, this should be in an environment variable.
// This key is for demonstration purposes.
//
// API Rate Limiting:
// While TMDB's legacy rate limits are disabled, there's an upper limit around 40 requests per second to prevent abuse.
// This limit can change at any time, so be respectful of the service and handle 429 "Too Many Requests" responses gracefully.
export const TMDB_API_KEY = '554247e0e3fe60f8ee159c2a2928a4f1';
export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// IMPORTANT: Credentials for The TVDB API.
// SECURITY NOTE: In a production app with a backend server, this key should be stored
// in a secure environment variable and used server-side to avoid exposure on the client.
// This implementation reflects the current frontend-only architecture.
export const TVDB_API_KEY = "fb60da1c-506e-4ae9-ac53-03d221d09d9c";
export const TVDB_API_BASE_URL = 'https://api4.thetvdb.com/v4';

// IMPORTANT: Credentials for the Trakt.tv API.
// This is the Client ID. In a production app, this should be in an environment variable.
export const TRAKT_API_KEY = "a4304a02576bf36fea742a910ebfc82cd3be1c38bc47fb50db7995699da81c18";
// SECURITY NOTE: In a production app, the client secret should NEVER be exposed on the client-side.
// The token exchange flow should happen on a secure backend server. This is for demonstration purposes only.
export const TRAKT_CLIENT_SECRET = "32aa7b70d09333816727bbc2293113b75b31497a899fa498598366506c653e03";
export const TRAKT_API_BASE_URL = 'https://api.trakt.tv';
export const TRAKT_REDIRECT_URI = window.location.origin + '/auth/trakt/callback';

// IMPORTANT: Credentials for MyAnimeList API
// This is the Client ID. In a real app, this should be in an environment variable.
// Using a placeholder for now as a real one requires a registered application.
// For demonstration, a method to generate a PKCE code verifier is used instead of a secret.
export const MAL_CLIENT_ID = 'a755b330561e298533c7c251d7cde369';
export const MAL_API_BASE_URL = 'https://api.myanimelist.net/v2';
export const MAL_AUTH_BASE_URL = 'https://myanimelist.net/v1/oauth2/authorize';
export const MAL_TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token';
export const MAL_REDIRECT_URI = window.location.origin + window.location.pathname;


// --- Branded SVG Placeholders ---
const posterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300" fill="none"><rect width="200" height="300" fill="#1e293b"/><g opacity="0.4" transform="translate(60 110) scale(0.8)"><g transform="rotate(-10 40 9)"><path d="M0 0 H80 L75 18 H-5 Z" fill="#94a3b8"/><path d="M5 2 H18 L13 16 H0 z" fill="#334155"/><path d="M25 2 H38 L33 16 H20 z" fill="#334155"/><path d="M45 2 H58 L53 16 H40 z" fill="#334155"/><path d="M65 2 H78 L73 16 H60 z" fill="#334155"/></g><rect x="0" y="22" width="80" height="50" rx="5" ry="5" fill="#64748b"/><path d="M32 38 L52 50 L32 62 Z" fill="#1e293b"/></g></svg>`;
const backdropSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="none"><rect width="320" height="180" fill="#1e293b"/><g opacity="0.4" transform="translate(120 50) scale(0.8)"><g transform="rotate(-10 40 9)"><path d="M0 0 H80 L75 18 H-5 Z" fill="#94a3b8"/><path d="M5 2 H18 L13 16 H0 z" fill="#334155"/><path d="M25 2 H38 L33 16 H20 z" fill="#334155"/><path d="M45 2 H58 L53 16 H40 z" fill="#334155"/><path d="M65 2 H78 L73 16 H60 z" fill="#334155"/></g><rect x="0" y="22" width="80" height="50" rx="5" ry="5" fill="#64748b"/><path d="M32 38 L52 50 L32 62 Z" fill="#1e293b"/></g></svg>`;
const profileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" fill="#1e293b"/><path fill="#64748b" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;

export const PLACEHOLDER_POSTER = `data:image/svg+xml;base64,${btoa(posterSvg)}`;
export const PLACEHOLDER_POSTER_SMALL = PLACEHOLDER_POSTER;
export const PLACEHOLDER_BACKDROP = `data:image/svg+xml;base64,${btoa(backdropSvg)}`;
export const PLACEHOLDER_BACKDROP_LARGE = PLACEHOLDER_BACKDROP;
export const PLACEHOLDER_STILL = PLACEHOLDER_BACKDROP;
export const PLACEHOLDER_PROFILE = `data:image/svg+xml;base64,${btoa(profileSvg)}`;


// --- Google Drive API ---
// IMPORTANT: You must create your own project in Google Cloud Console,
// enable the Google Drive API, and create OAuth 2.0 credentials (for Web Application).
// For more info: https://developers.google.com/drive/api/v3/quickstart/js
export const GOOGLE_CLIENT_ID = "821958016255-h37tfqahfhkge7navdh7h5uv43gkcsf8.apps.googleusercontent.com";
export const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
export const DRIVE_DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
export const DRIVE_APP_FOLDER = 'appDataFolder';
export const DRIVE_FILE_NAME = 'sceneit_data.json';
