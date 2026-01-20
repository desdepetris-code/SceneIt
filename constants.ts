// TMDB API Key. For a production app, this should be in an environment variable.
// This key is for demonstration purposes.
export const TMDB_API_KEY = 'b7922161a07780ff1d7caf291ecfa9ec';
export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// IMPORTANT: Credentials for The TVDB API.
export const TVDB_API_KEY = "3f17fc0f-2f0b-48b2-9dec-f7074608790f";
export const TVDB_API_BASE_URL = 'https://api4.thetvdb.com/v4';

// IMPORTANT: Credentials for the Trakt.tv API.
export const TRAKT_API_KEY = "a4304a02576bf36fea742a910ebfc82cd3be1c38bc47fb50db7995699da81c18";
export const TRAKT_API_BASE_URL = 'https://api.trakt.tv';
export const TRAKT_REDIRECT_URI = window.location.origin + '/auth/trakt/callback';

// IMPORTANT: Credentials for MyAnimeList API
export const MAL_CLIENT_ID = 'a755b330561e298533c7c251d7cde369';
export const MAL_API_BASE_URL = 'https://api.myanimelist.net/v2';
export const MAL_AUTH_BASE_URL = 'https://myanimelist.net/v1/oauth2/authorize';
export const MAL_TOKEN_URL = 'https://myanimelist.net/v1/oauth2/token';
export const MAL_REDIRECT_URI = window.location.origin + window.location.pathname;

// --- Branded Grey and White SVG Placeholders ---

const logoSvgPart = `
  <circle cx="50" cy="50" r="48" fill="#1a1a1a" stroke="#444" stroke-width="1" />
  <path d="M50 2L65 30H35L50 2Z" fill="#888" opacity="0.2" />
  <path d="M98 50L70 65V35L98 50Z" fill="#888" opacity="0.2" />
  <path d="M50 98L35 70H65L50 98Z" fill="#888" opacity="0.2" />
  <path d="M2 50L30 35V65L2 50Z" fill="#888" opacity="0.2" />
  <circle cx="50" cy="50" r="32" fill="#000" stroke="#333" stroke-width="2" />
  <text x="50" y="62" font-family="Arial Black, sans-serif" font-size="28" font-weight="900" fill="#fff" text-anchor="middle" letter-spacing="-1">
    C<tspan fill="#aaa">M</tspan>
  </text>
  <circle cx="35" cy="35" r="4" fill="white" opacity="0.2" />
`;

const posterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 100 150" fill="none">
  <rect width="100" height="150" fill="#0f0f0f" />
  <g transform="translate(10 35) scale(0.8)">
    ${logoSvgPart}
  </g>
</svg>`;

const backdropSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 160 90" fill="none">
  <rect width="160" height="90" fill="#0f0f0f" />
  <g transform="translate(57.5 22.5) scale(0.45)">
    ${logoSvgPart}
  </g>
</svg>`;

const profileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" fill="#0f0f0f" />
  <g transform="translate(25 25) scale(0.5)">
    ${logoSvgPart}
  </g>
</svg>`;

export const PLACEHOLDER_POSTER = `data:image/svg+xml;base64,${btoa(posterSvg)}`;
export const PLACEHOLDER_POSTER_SMALL = PLACEHOLDER_POSTER;
export const PLACEHOLDER_BACKDROP = `data:image/svg+xml;base64,${btoa(backdropSvg)}`;
export const PLACEHOLDER_BACKDROP_LARGE = PLACEHOLDER_BACKDROP;
export const PLACEHOLDER_STILL = PLACEHOLDER_BACKDROP;
export const PLACEHOLDER_PROFILE = `data:image/svg+xml;base64,${btoa(profileSvg)}`;