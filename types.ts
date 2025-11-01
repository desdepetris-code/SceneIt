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
  popularity?: number;
  rating?: number; // For rated items
  // FIX: Add optional vote_average property to allow sorting by rating in search results.
  vote_average?: number;
}

export interface TmdbPerson {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
    popularity: number;
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
  runtime?: number | null;
}

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

export interface TmdbNetwork {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
}

export interface TmdbCreator {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: string | null;
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
    imdb_id?: string;
    tvdb_id?: number;
  };
  vote_average?: number;
  vote_count?: number;
  credits?: Credits;
  recommendations?: Recommendations;
  videos?: {
    results: TmdbVideo[];
  };
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  last_episode_to_air?: Episode | null;
  next_episode_to_air?: Episode | null;
  created_by?: TmdbCreator[]; // For TV
  networks?: TmdbNetwork[];
  production_companies?: { name: string; id: number; logo_path: string | null; origin_country: string; }[];
  origin_country?: string[];
  original_language?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  homepage?: string;
  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: {
        certification: string;
        iso_639_1: string;
        note: string;
        release_date: string;
        type: number;
      }[];
    }[];
  };
}

export interface TmdbCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TmdbMedia[];
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
  logId: string;
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  timestamp: string;
  seasonNumber?: number;
  episodeNumber?: number;
  note?: string;
}

export type CustomImagePaths = Record<number, { poster_path?: string; backdrop_path?: string }>;
export type WatchStatus = 'watching' | 'planToWatch' | 'completed' | 'onHold' | 'dropped' | 'favorites';

export type ProfileTab = 'overview' | 'library' | 'history' | 'stats' | 'imports' | 'achievements' | 'settings' | 'seasonLog' | 'favorites' | 'lists' | 'journal' | 'ratings' | 'searchHistory' | 'commentHistory' | 'updates' | 'notifications' | 'activity';

export type ScreenName = 'home' | 'search' | 'progress' | 'profile' | 'history' | 'achievements' | 'calendar' | 'activity' | 'allNewReleases' | 'allTrendingTV' | 'allTrendingMovies';

export type FavoriteEpisodes = Record<number, Record<number, Record<number, boolean>>>; // showId -> seasonNum -> episodeNum -> true
export type EpisodeRatings = Record<number, Record<number, Record<number, number>>>; // showId -> seasonNum -> episodeNum -> rating

// --- Theme Types ---
export type ParticleEffectName = 'snow' | 'hearts' | 'leaves' | 'confetti' | 'fireworks' | 'sparkles' | 'bats' | 'flowers' | 'pumpkins' | 'ghosts' | 'eggs';

export interface Theme {
  id: string;
  name: string;
  base: 'light' | 'dark';
  requiredLevel?: number;
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
    patternBgSize?: string;
    patternBgColor?: string;
    patternBgPosition?: string;
    particleEffect?: ParticleEffectName[];
  };
}

export interface ProfileTheme {
    backgroundImage: string | null;
    fontFamily: string | null;
}

// --- Achievement Types ---
export type AchievementDifficulty = 'Easy' | 'Medium' | 'Hard';


export interface CustomListItem {
  id: number; // tmdb id
  media_type: 'tv' | 'movie';
  title: string;
  poster_path: string | null;
}

export interface CustomList {
  id: string; // uuid or timestamp
  name: string;
  description: string;
  items: CustomListItem[];
  createdAt: string;
  isPublic?: boolean;
  likes?: string[]; // Array of user IDs
}

export type UserRatings = Record<number, { rating: number; date: string }>; // mediaId -> { rating, date }
export type SearchHistoryItem = { query: string; timestamp: string };

export interface Comment {
    id: string; // uuid
    mediaKey: string; // e.g., 'movie-123' or 'tv-456-s1-e2'
    text: string;
    timestamp: string;
}

export interface UserData {
    watching: TrackedItem[];
    planToWatch: TrackedItem[];
    completed: TrackedItem[];
    onHold: TrackedItem[];
    dropped: TrackedItem[];
    favorites: TrackedItem[];
    watchProgress: WatchProgress;
    history: HistoryItem[];
    customLists: CustomList[];
    ratings: UserRatings;
    episodeRatings: EpisodeRatings;
    searchHistory: SearchHistoryItem[];
    comments: Comment[];
    mediaNotes?: Record<number, string>; // mediaId -> note text
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
    hoursWatchedThisWeek: number;
    planToWatchCount: number;
    hoursWatchedThisMonth: number;
    topGenresThisMonth: number[];
    genreDistributionThisMonth: Record<number, number>;
    totalHoursWatched: number;
    showsWatchingCount: number;
    moviesToWatchCount: number;
    topGenresAllTime: number[];
    genreDistributionAllTime: Record<number, number>;
    weeklyActivity: number[];
    moodDistribution: Record<string, number>;
    monthlyActivity: { month: string; count: number }[];
    episodesWatchedThisMonth: number;
    moviesWatchedThisMonth: number;
    episodesWatchedThisYear: number;
    moviesWatchedThisYear: number;
    hoursWatchedThisYear: number;
    mostActiveDay: string;
    // For achievements
    completedSeasonsCount?: number;
    ratedItemsCount: number;
    customListsCount: number;
    maxItemsInCustomList: number;
    distinctMoodsCount: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  difficulty: AchievementDifficulty;
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

export interface TvdbRelatedShow {
  id: number;
  name: string;
  image: string;
  typeName: string;
  status: { name: string };
}

export interface TmdbFindResponse {
    movie_results: TmdbMedia[];
    tv_results: TmdbMedia[];
}

export interface PersonCredit extends TmdbMedia {
  character?: string;
  credit_id: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  combined_credits: {
    cast: PersonCredit[];
  };
  images: {
    profiles: TmdbImage[];
  };
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
  type: 'new_season' | 'recommendation' | 'achievement_unlocked' | 'new_sequel' | 'status_change' | 'new_follower' | 'list_like' | 'release_reminder';
  mediaId?: number;
  mediaType?: 'tv' | 'movie';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  poster_path?: string | null;
  followerInfo?: {
      userId: string;
      username: string;
  };
  listId?: string;
  listName?: string;
  likerInfo?: {
      userId: string;
      username: string;
  };
}

export interface NotificationSettings {
  masterEnabled: boolean;
  newEpisodes: boolean;
  movieReleases: boolean;
  sounds: boolean;
  newFollowers: boolean;
  listLikes: boolean;
  appUpdates: boolean;
  importSyncCompleted: boolean;
  showWatchedConfirmation: boolean;
}

// --- VIP & Season Log Types ---
export interface SeasonLogItem {
  showId: number;
  showTitle: string;
  posterPath: string | null;
  seasonNumber: number;
  seasonName: string;
  completionDate: string;
  premiereDate?: string | null;
  endDate?: string | null;
  userStartDate?: string | null;
}

// --- Live Watch Types ---
export interface LiveWatchMediaInfo {
  id: number;
  media_type: 'tv' | 'movie';
  title: string;
  poster_path: string | null;
  runtime: number; // in minutes
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

// --- Calendar Types ---
export interface CalendarItem {
    id: number;
    media_type: 'tv' | 'movie';
    poster_path: string | null;
    still_path?: string | null;
    title: string;
    date: string; // ISO string 'YYYY-MM-DD'
    airtime?: string;
    episodeInfo?: string;
    network?: string;
    overview?: string;
    runtime?: number;
}

export interface EpisodeWithAirtime extends Episode {
  airtime?: string;
}

export interface FullSeasonDrop {
  type: 'full_season_drop';
  showId: number;
  showTitle: string;
  seasonNumber: number;
  seasonName: string;
  poster_path: string | null;
  date: string;
  airtime?: string;
  network?: string;
  episodes: EpisodeWithAirtime[];
}


// --- Episode Tag ---
export interface EpisodeTag {
  text: string;
  className: string;
}

// --- Community Search Types ---
export interface PublicUser {
    id: string;
    username: string;
    profilePictureUrl: string | null;
}

export interface PublicCustomList extends CustomList {
    user: {
        id: string;
        username: string;
    }
}

// --- Trakt.tv Types ---
export interface TraktToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    created_at: number; // Unix timestamp
}

interface TraktIds {
    trakt: number;
    slug: string;
    imdb: string;
    tmdb: number;
}

interface TraktMedia {
    title: string;
    year: number;
    ids: TraktIds;
}

export interface TraktWatchedMovie {
    plays: number;
    last_watched_at: string;
    movie: TraktMedia;
}

export interface TraktWatchedShow {
    plays: number;
    last_watched_at: string;
    show: TraktMedia;
    seasons: {
        number: number;
        episodes: {
            number: number;
            plays: number;
            last_watched_at: string;
        }[];
    }[];
}

export interface TraktWatchlistItem {
    rank: number;
    listed_at: string;
    type: 'movie' | 'show';
    movie?: TraktMedia;
    show?: TraktMedia;
}

export interface TraktRating {
    rated_at: string;
    rating: number; // 1-10
    type: 'movie' | 'show' | 'season' | 'episode';
    movie?: TraktMedia;
    show?: TraktMedia;
}

export interface TraktCalendarMovie {
  released: string;
  movie: TraktMedia;
}

export interface TraktCalendarShow {
  first_aired: string;
  episode: {
    season: number;
    number: number;
    title: string;
    ids: TraktIds;
  };
  show: TraktMedia;
}

// --- Social & Privacy Types ---
export type Follows = Record<string, string[]>; // userId -> followedUserId[]

export interface PrivacySettings {
  activityVisibility: 'public' | 'followers' | 'private';
}

// --- Activity Feed Types ---
export type ActivityType = 'WATCHED_EPISODE' | 'WATCHED_MOVIE' | 'RATED_ITEM' | 'CREATED_LIST';

export interface Activity {
  user: PublicUser;
  timestamp: string;
  type: ActivityType;
  media?: TrackedItem;
  listName?: string;
  rating?: number;
  episodeInfo?: string;
}

export interface FriendActivity {
    user: PublicUser;
    activities: Activity[];
}

export type ReminderType = 'release' | 'day_before' | 'week_before';

export interface Reminder {
  id: string; // e.g., 'rem-tv-123-2025-10-25'
  mediaId: number;
  mediaType: 'tv' | 'movie';
  releaseDate: string; // ISO date string 'YYYY-MM-DD'
  title: string;
  poster_path: string | null;
  episodeInfo?: string;
  reminderType: ReminderType;
}

// --- TVMaze Types ---
export interface TvMazeScheduleItem {
  id: number;
  airdate: string;
  airtime: string;
  runtime: number;
  show: {
    id: number;
    name: string;
    externals: {
      tvrage: number | null;
      thetvdb: number | null;
      imdb: string | null;
    };
    network: {
      name: string;
    } | null;
  };
  season: number;
  number: number;
}