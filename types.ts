
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
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  overview?: string;
  popularity?: number;
  rating?: number;
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
  vote_average?: number;
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
  crew?: CrewMember[];
  guest_stars?: CastMember[];
  vote_average?: number;
  vote_count?: number;
  episode_type?: string;
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
  department?: string;
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
  runtime?: number;
  episode_run_time?: number[];
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
  created_by?: TmdbCreator[];
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
  content_ratings?: {
    results: {
      iso_3166_1: string;
      rating: string;
      descriptors: string[];
    }[];
  };
}

export interface EpisodeProgress {
  status: 0 | 1 | 2;
  journal?: JournalEntry;
}

export type SeasonProgress = Record<number, EpisodeProgress>;
export type ShowProgress = Record<number, SeasonProgress>;
export type WatchProgress = Record<number, ShowProgress>;

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
  episodeTitle?: string;
  note?: string;
}

export type CustomImagePaths = Record<number, { poster_path?: string; backdrop_path?: string }>;
export type WatchStatus = 'watching' | 'planToWatch' | 'completed' | 'onHold' | 'dropped' | 'favorites';

export type ProfileTab = 'overview' | 'journey' | 'history' | 'weeklyPicks' | 'library' | 'lists' | 'stats' | 'imports' | 'achievements' | 'settings' | 'seasonLog' | 'favorites' | 'journal' | 'ratings' | 'searchHistory' | 'commentHistory' | 'notifications' | 'activity';

export type ScreenName = 'home' | 'search' | 'progress' | 'profile' | 'history' | 'achievements' | 'calendar' | 'activity' | 'allNewReleases' | 'allTrendingTV' | 'allTrendingMovies' | 'allTopRated' | 'allBingeWorthy' | 'allNewlyPopularEpisodes' | 'allHiddenGems' | 'allTopComedy' | 'allWestern' | 'allSciFi';

export type FavoriteEpisodes = Record<number, Record<number, Record<number, boolean>>>;
export type EpisodeRatings = Record<number, Record<number, Record<number, number>>>;
export type SeasonRatings = Record<number, Record<number, number>>;

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
    onAccent?: string;
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

export type AchievementDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface CustomListItem {
  id: number;
  media_type: 'tv' | 'movie';
  title: string;
  poster_path: string | null;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  items: CustomListItem[];
  createdAt: string;
  isPublic?: boolean;
  likes?: string[];
}

export type UserRatings = Record<number, { rating: number; date: string }>;
export type SearchHistoryItem = { query: string; timestamp: string };

export interface Comment {
    id: string;
    mediaKey: string;
    text: string;
    timestamp: string;
    user: {
        id: string;
        username: string;
        profilePictureUrl: string | null;
    };
    parentId: string | null;
    likes: string[];
    isSpoiler: boolean;
}

export interface Note {
  id: string;
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
    weeklyFavorites: TrackedItem[];
    weeklyFavoritesHistory?: Record<string, TrackedItem[]>;
    watchProgress: WatchProgress;
    history: HistoryItem[];
    customLists: CustomList[];
    ratings: UserRatings;
    episodeRatings: EpisodeRatings;
    favoriteEpisodes: FavoriteEpisodes;
    searchHistory: SearchHistoryItem[];
    comments: Comment[];
    mediaNotes?: Record<number, Note[]>;
    episodeNotes?: Record<number, Record<number, Record<number, Note[]>>>;
    seasonRatings: SeasonRatings;
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
    ratedItemsCount: number;
    customListsCount: number;
    maxItemsInCustomList: number;
    distinctMoodsCount: number;
    completedSeasonsCount?: number;
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

export interface TraktToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    created_at: number;
}

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
  achievementId?: string;
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

export interface PrivacySettings {
  activityVisibility: 'public' | 'followers' | 'private';
}

export interface Follows {
    [userId: string]: string[];
}

export interface LiveWatchMediaInfo {
  id: number;
  media_type: 'tv' | 'movie';
  title: string;
  poster_path: string | null;
  runtime: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

export interface EpisodeTag {
  text: string;
  className: string;
}

export interface FriendActivity {
    user: PublicUser;
    activities: Activity[];
}

export interface PublicUser {
    id: string;
    username: string;
    profilePictureUrl: string | null;
}

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

export interface CalendarItem {
    id: number;
    media_type: 'tv' | 'movie';
    poster_path: string | null;
    still_path?: string | null;
    title: string;
    date: string;
    airtime?: string;
    episodeInfo?: string;
    network?: string;
    overview?: string;
    runtime?: number;
    isInCollection?: boolean;
}

export interface Reminder {
  id: string;
  mediaId: number;
  mediaType: 'tv' | 'movie';
  releaseDate: string;
  title: string;
  poster_path: string | null;
  episodeInfo?: string;
  reminderType: ReminderType;
}

export type ReminderType = 'release' | 'day_before' | 'week_before';

export interface NewlyPopularEpisode {
  showInfo: TrackedItem;
  episode: Episode;
}

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

// --- ADDED MISSING TYPES ---

// FIX: Added TmdbSeasonDetails for TV season episode listings.
export interface TmdbSeasonDetails {
  air_date: string;
  episodes: Episode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string | null;
  season_number: number;
  vote_average?: number;
}

// FIX: Added WatchProvider and WatchProviderResponse for availability information.
export interface WatchProvider {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

export interface WatchProviderResponse {
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: WatchProvider[];
      rent?: WatchProvider[];
      buy?: WatchProvider[];
    };
  };
}

// FIX: Added TmdbCollection for movie collections (e.g. sequels).
export interface TmdbCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TmdbMedia[];
}

// FIX: Added TmdbFindResponse for looking up items by external IDs (IMDb/TVDB).
export interface TmdbFindResponse {
  movie_results: TmdbMedia[];
  person_results: any[];
  tv_results: TmdbMedia[];
  tv_episode_results: any[];
  tv_season_results: any[];
}

// FIX: Added PersonCredit for filmography results.
export interface PersonCredit extends TmdbMedia {
    character: string;
    credit_id: string;
    order?: number;
}

// FIX: Added PersonDetails for actor profiles.
export interface PersonDetails extends TmdbPerson {
  birthday: string | null;
  deathday: string | null;
  biography: string;
  place_of_birth: string | null;
  images?: {
    profiles: TmdbImage[];
  };
  combined_credits?: {
    cast: PersonCredit[];
    crew: PersonCredit[];
  };
}

// FIX: Added TvdbShow for supplementary TV metadata.
export interface TvdbShow {
  id: number;
  name: string;
  artworks?: {
    id: number;
    image: string;
    type: number;
  }[];
}

// FIX: Added PublicCustomList for shared community lists.
export interface PublicCustomList extends CustomList {
    user: {
        id: string;
        username: string;
        profilePictureUrl?: string | null;
    };
}

// FIX: Added TvdbToken for TVDB API authentication.
export interface TvdbToken {
    token: string;
    expiry: number;
}

// FIX: Added TvdbRelatedShow for related series links.
export interface TvdbRelatedShow {
    id: number;
    typeName: string;
}

// FIX: Added TraktIds and Trakt types for Trakt.tv integration.
export interface TraktIds {
    trakt: number;
    slug?: string;
    tvdb?: number;
    imdb?: string;
    tmdb?: number;
}

export interface TraktWatchedMovie {
    plays: number;
    last_watched_at: string;
    movie: {
        title: string;
        year: number;
        ids: TraktIds;
    };
}

export interface TraktWatchedShow {
    plays: number;
    last_watched_at: string;
    show: {
        title: string;
        year: number;
        ids: TraktIds;
    };
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
    id: number;
    type: 'movie' | 'show';
    movie?: { title: string; ids: TraktIds };
    show?: { title: string; ids: TraktIds };
}

export interface TraktRating {
    rating: number;
    rated_at: string;
    type: 'movie' | 'show' | 'season' | 'episode';
    movie?: { title: string; ids: TraktIds };
    show?: { title: string; ids: TraktIds };
}

export interface TraktCalendarShow {
    first_aired: string;
    show: { title: string; ids: TraktIds };
    episode: { season: number; number: number; title: string };
}

export interface TraktCalendarMovie {
    released: string;
    movie: { title: string; ids: TraktIds };
}

// FIX: Added EpisodeWithAirtime for calendar displays.
export interface EpisodeWithAirtime extends Episode {
    airtime?: string;
}

// FIX: Added FullSeasonDrop for binge-releases.
export interface FullSeasonDrop {
    showId: number;
    showTitle: string;
    seasonNumber: number;
    seasonName: string;
    poster_path: string | null;
    airDate: string;
    airtime?: string;
    network?: string;
    episodes: EpisodeWithAirtime[];
}
