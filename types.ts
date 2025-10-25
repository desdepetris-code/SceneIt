// types.ts

export interface TmdbImage {
  file_path: string;
  width: number;
  height: number;
  iso_639_1: string | null;
  aspect_ratio: number;
  vote_average: number;
  vote_count: number;
}

export interface TmdbMedia {
  id: number;
  title?: string; // Movies have title
  name?: string; // TV shows have name
  poster_path: string | null;
  backdrop_path?: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string; // Movies
  first_air_date?: string; // TV
  genre_ids?: number[];
  overview?: string;
}

export interface TrackedItem {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  genre_ids?: number[];
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
}

// FIX: Added types for credits and recommendations to match TMDB API response.
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Recommendations {
  results: TmdbMedia[];
}

export interface TmdbVideo {
    iso_639_1: string;
    iso_3166_1: string;
    name: string;
    key: string;
    site: string;
    size: number;
    type: string;
    official: boolean;
    published_at: string;
    id: string;
}

export interface TmdbMediaDetails extends TmdbMedia {
  genres: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  runtime?: number; // movie
  episode_run_time?: number[]; // tv
  status?: string;
  images?: {
    backdrops: TmdbImage[];
    posters: TmdbImage[];
  };
  external_ids?: {
    tvdb_id?: number;
  };
  vote_average?: number;
  vote_count?: number;
  // FIX: Added missing properties to align with data fetched from TMDB service.
  credits?: Credits;
  recommendations?: Recommendations;
  videos?: {
    results: TmdbVideo[];
  };
}

export interface TmdbSeasonDetails {
  _id: string;
  air_date: string;
  episodes: Episode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string;
  season_number: number;
}

export interface EpisodeProgress {
  status: 0 | 1 | 2; // 0: unwatched, 1: partially watched (not used), 2: watched
  journal?: JournalEntry;
}

export type SeasonProgress = Record<number, EpisodeProgress>; // episode number -> progress
export type ShowProgress = Record<number, SeasonProgress>; // season number -> progress
export type WatchProgress = Record<number, ShowProgress>; // show id -> progress

export interface JournalEntry {
  text: string;
  mood: string;
  timestamp: string;
}

export interface HistoryItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  timestamp: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

export type CustomImagePaths = Record<number, { poster_path?: string; backdrop_path?: string }>;
export type WatchStatus = 'watching' | 'planToWatch' | 'completed' | 'favorites';

// --- Theme Types ---
export interface Theme {
  id: string;
  name: string;
  base: 'light' | 'dark';
  colors: {
    bgGradient: string;
    accentGradient: string;
    cardGradient: string;
    textColorPrimary: string;
    textColorSecondary: string;
    accentPrimary: string;
    accentSecondary: string;
    bgPrimary: string;
    bgSecondary: string;
    bgBackdrop: string;
  };
}

// --- Achievement Types ---
export type AchievementDifficulty = 'Easy' | 'Medium' | 'Hard';
export type AchievementReward = 'none' | 'vipPass' | 'vipFeature';

export interface UserData {
    watching: TrackedItem[];
    planToWatch: TrackedItem[];
    completed: TrackedItem[];
    favorites: TrackedItem[];
    watchProgress: WatchProgress;
    history: HistoryItem[];
}

export interface CalculatedStats {
    totalEpisodesWatched: number;
    nonManualEpisodesWatched: number;
    longestStreak: number;
    watchedThisWeek: number;
    journalCount: number;
    moodJournalCount: number;
    showsCompleted: number;
    moviesCompleted: number;
    totalItemsOnLists: number;
    watchedGenreCount: number;
    episodesWatchedToday: number;
    moviesWatchedToday: number;
    moviesWatchedThisWeek: number;
    planToWatchCount: number;
    hoursWatchedThisMonth: number;
    topGenresThisMonth: number[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  difficulty: AchievementDifficulty;
  reward: AchievementReward;
  adminApprovalRequired: boolean;
  // check function returns current progress and the goal to unlock
  check: (data: UserData, stats: CalculatedStats) => { progress: number; goal: number };
}

export interface UserAchievementStatus extends Achievement {
  unlocked: boolean;
  progress: number;
  goal: number;
}

// --- TVDB Types ---
export interface TvdbToken {
  token: string;
  // TVDB tokens expire after 1 month. We'll refresh after 28 days just to be safe.
  expiry: number; 
}

export interface TvdbCharacter {
    id: number;
    name: string;
    personName: string;
    image: string;
}

export interface TvdbShow {
    id: number;
    name: string;
    image: string;
    score: number;
    overview?: string;
    artworks?: { type: number; image: string; thumbnail: string }[];
    characters: TvdbCharacter[];
    status: {
        id: number;
        name: string;
        recordType: string;
        keepUpdated: boolean;
    };
}

// --- Trakt Types ---
export interface TraktTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

interface TraktIds {
  trakt: number;
  slug: string;
  tvdb: number;
  imdb: string;
  tmdb: number;
  tvrage: number | null;
}

interface TraktMovie {
  title: string;
  year: number;
  ids: TraktIds;
}

interface TraktShow {
  title: string;
  year: number;
  ids: TraktIds;
}

interface TraktEpisode {
  season: number;
  number: number;
  title: string;
  ids: TraktIds;
}

export interface TraktHistoryItem {
  id: number;
  watched_at: string;
  action: string;
  type: 'movie' | 'episode';
  movie?: TraktMovie;
  show?: TraktShow;
  episode?: TraktEpisode;
}


// --- GenAI Types ---
export interface RecommendedMovie {
  title: string;
  year: number;
}

// --- Watch Provider Types ---
export interface Provider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface ProviderDetails {
  link: string;
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

export interface WatchProviderResponse {
  id: number;
  results: {
    [countryCode: string]: ProviderDetails;
  };
}

// --- Notification Types ---
export interface AppNotification {
  id: string;
  type: 'new_season' | 'recommendation' | 'achievement_unlocked';
  mediaId: number;
  mediaType: 'tv' | 'movie';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  poster_path: string | null;
}

// --- Google Drive Types ---
export interface DriveUser {
  name: string;
  email: string;
  imageUrl: string;
}

export interface DriveStatus {
  isGapiReady: boolean;
  isSignedIn: boolean;
  user: DriveUser | null;
  lastSync: string | null;
  isSyncing: boolean;
  error: string | null;
}