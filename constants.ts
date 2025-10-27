
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
export const TRAKT_API_KEY = "ad252154b0b835979527f33c3167b5b788647087413a9686526a51d989e78267";
// SECURITY NOTE: In a production app, the client secret should NEVER be exposed on the client-side.
// The token exchange flow should happen on a secure backend server. This is for demonstration purposes only.
export const TRAKT_CLIENT_SECRET = "02312217c170b751853472093c83a158f46401f802d33458525b6e22f87a8f15";
export const TRAKT_API_BASE_URL = 'https://api.trakt.tv';
export const TRAKT_REDIRECT_URI = window.location.origin + window.location.pathname;

// IMPORTANT: Credentials for MyAnimeList API
// This is the Client ID. In a real app, this should be in an environment variable.
// Using a placeholder for now as a real one requires a registered application.
// For demonstration, a method to generate a PKCE code verifier is used instead of a secret.
export const MAL_CLIENT_ID = 'a755b330561e298533c7c251d7cde369';
export const MAL_API_BASE_URL = 'https://api.myanimelist.net/v2';
export const MAL_AUTH_BASE_URL = 'https://myanimelist.net/v1/oauth2/authorize';
export const MAL_TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token';
export const MAL_REDIRECT_URI = window.location.origin + window.location.pathname;

export const GEMINI_API_KEY = 'AIzaSyD5D5_TFw-5uzyrYZGOIH2AxpX9lmHBC-s';


// Placeholder Images
export const PLACEHOLDER_POSTER = 'https://via.placeholder.com/342x513.png?text=SceneIt';
export const PLACEHOLDER_POSTER_SMALL = 'https://via.placeholder.com/92x138.png?text=N/A';
export const PLACEHOLDER_BACKDROP = 'https://via.placeholder.com/500x281.png?text=SceneIt';
export const PLACEHOLDER_BACKDROP_LARGE = 'https://via.placeholder.com/1280x720.png?text=SceneIt';
export const PLACEHOLDER_STILL = 'https://via.placeholder.com/300x169.png?text=SceneIt';
export const PLACEHOLDER_PROFILE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY0NzQ4YiI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';


// --- Google Drive API ---
// IMPORTANT: You must create your own project in Google Cloud Console,
// enable the Google Drive API, and create OAuth 2.0 credentials (for Web Application).
// Then, fill in the Client ID and API Key below.
// For more info: https://developers.google.com/drive/api/v3/quickstart/js
export const GOOGLE_CLIENT_ID = "821958016255-h37tfqahfhkge7navdh7h5uv43gkcsf8.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // <-- REPLACE
export const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
export const DRIVE_DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
export const DRIVE_APP_FOLDER = 'appDataFolder';
export const DRIVE_FILE_NAME = 'sceneit_data.json';