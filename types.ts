
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
  showPriorEpisodesPopup: boolean;
}

export interface ShortcutSettings {
  show: boolean;
  tabs: ProfileTab[];
}

export interface NavSettings {
  tabs: string[]; // Mixed ScreenName and ProfileTab
  position: 'bottom' | 'left' | 'right';
  hoverRevealNav: boolean;
  hoverRevealHeader: boolean;
}

export type ScreenName = 'home' | 'search' | 'calendar' | 'progress' | 'profile' | 'allNewReleases' | 'allTrendingTV' | 'allTrendingMovies' | 'allTopRated' | 'allBingeWorthy' | 'allHiddenGems' | 'allTopComedy' | 'allWestern' | 'allSciFi' | 'allNewlyPopularEpisodes';

export type ProfileTab = 'overview' | 'progress' | 'history' | 'weeklyPicks' | 'library' | 'lists' | 'activity' | 'stats' | 'seasonLog' | 'journal' | 'achievements' | 'imports' | 'settings';

export type WatchStatus = 'watching' | 'planToWatch' | 'completed' | 'onHold' | 'dropped' | 'favorites';

export interface TrackedItem {
  id: number;
  title: string;
  media_type: 'tv' | 'movie' | 'person';
  poster_path: string | null;
  genre_ids?: number[];
}

export interface WeeklyPick extends TrackedItem {
  category: 'tv' | 'movie' | 'actor' | 'actress';
  dayIndex: number; // 0: Mon, 1: Tue, 2: Wed, 3: Thu, 4: Fri, 5: Sat, 6: Sun
}

export interface TmdbMedia {
  id: number;
  title?: string;
  name?: string;
  media_type: 'tv' | 'movie' | 'person';
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
}

// Added missing TmdbImage interface to fix 'Cannot find name' errors.
/**
 * Interface representing a TMDB image.
 */
export interface TmdbImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface TmdbMediaDetails extends TmdbMedia {
  genres: { id: number; name: string }[];
  overview: string | null;
  tagline: string | null;
  runtime?: number;
  episode_run_time?: number[];
  status: string;
  networks: { id: number; name: string; logo_path: string | null }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  last_episode_to_air?: Episode | null;
  next_episode_to_air?: Episode | null;
  seasons?: TmdbSeason[];
  images?: {
    backdrops: TmdbImage[];
    posters: TmdbImage[];
  };
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  recommendations?: {
    results: TmdbMedia[];
  };
  external_ids?: {
    imdb_id?: string;
    tvdb_id?: number;
  };
  content_ratings?: { results: any[] };
  release_dates?: { results: any[] };
  budget?: number;
  revenue?: number;
  original_language?: string;
  origin_country?: string[];
  belongs_to_collection?: { id: number; name: string; poster_path: string | null; backdrop_path: string | null } | null;
}

export interface TmdbSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
  vote_average?: number;
}

export interface TmdbSeasonDetails extends TmdbSeason {
  episodes: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
  vote_average?: number;
  vote_count?: number;
  episode_type?: string;
  crew?: CrewMember[];
  guest_stars?: CastMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  gender?: number; // 1: Female, 2: Male
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbFindResponse {
  movie_results: TmdbMedia[];
  tv_results: TmdbMedia[];
  person_results: TmdbPerson[];
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  media_type?: 'person';
  gender?: number;
}

export interface PersonDetails extends TmdbPerson {
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  images?: { profiles: TmdbImage[] };
  combined_credits?: {
    cast: PersonCredit[];
    crew: PersonCredit[];
  };
}

export interface PersonCredit extends TmdbMedia {
  character?: string;
  job?: string;
  credit_id: string;
}

export interface HistoryItem extends TrackedItem {
  logId: string;
  timestamp: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  note?: string;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: string;
}

export interface JournalEntry {
  text: string;
  mood: string;
  timestamp: string;
}

export interface EpisodeProgress {
  status: 0 | 1 | 2; // 0: unwatched, 1: watching, 2: watched
  journal?: JournalEntry;
}

export type SeasonProgress = Record<number, EpisodeProgress>;
export type ShowProgress = Record<number, SeasonProgress>;
export type WatchProgress = Record<number, ShowProgress>;

export interface CustomListItem extends TrackedItem {}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  items: CustomListItem[];
  createdAt: string;
  isPublic: boolean;
  likes: string[]; // User IDs who liked this list
}

export interface PublicCustomList extends CustomList {
  user: { id: string; username: string };
}

export interface UserRatings {
  [mediaId: number]: {
    rating: number;
    date: string;
  };
}

export interface EpisodeRatings {
  [showId: number]: {
    [seasonNumber: number]: {
      [episodeNumber: number]: number;
    };
  };
}

export interface SeasonRatings {
  [showId: number]: {
    [seasonNumber: number]: number;
  };
}

export interface FavoriteEpisodes {
  [showId: number]: {
    [seasonNumber: number]: {
      [episodeNumber: number]: boolean;
    };
  };
}

export interface Comment {
  id: string;
  mediaKey: string; // e.g., 'movie-123' or 'tv-123-s1-e1'
  text: string;
  timestamp: string;
  user: {
    id: string;
    username: string;
    profilePictureUrl: string | null;
  };
  parentId: string | null;
  likes: string[]; // User IDs
  isSpoiler: boolean;
}

export interface PublicUser {
  id: string;
  username: string;
  profilePictureUrl: string | null;
}

export interface Follows {
  [userId: string]: string[]; // User IDs that this user follows
}

export interface PrivacySettings {
  activityVisibility: 'public' | 'followers' | 'private';
}

export interface AppNotification {
  id: string;
  type: 'new_episode' | 'movie_release' | 'new_follower' | 'list_like' | 'app_update' | 'late_release_apology' | 'scheduled_reminder';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  mediaId?: number;
  mediaType?: 'tv' | 'movie';
  poster_path?: string | null;
  followerInfo?: { userId: string; username: string };
  likerInfo?: { userId: string; username: string; listId: string; listName: string };
}

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
    onAccent?: string;
    particleEffect?: ParticleEffectName[];
    patternBgSize?: string;
    patternBgColor?: string;
    patternBgPosition?: string;
  };
}

export type ParticleEffectName = 'snow' | 'hearts' | 'leaves' | 'confetti' | 'fireworks' | 'sparkles' | 'bats' | 'flowers' | 'pumpkins' | 'ghosts' | 'eggs';

export interface ProfileTheme {
  backgroundImage: string | null;
  fontFamily: string | null;
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
  weeklyFavorites: WeeklyPick[];
  weeklyFavoritesHistory: Record<string, WeeklyPick[]>;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  customLists: CustomList[];
  ratings: UserRatings;
  episodeRatings: EpisodeRatings;
  seasonRatings: SeasonRatings;
  favoriteEpisodes: FavoriteEpisodes;
  searchHistory: SearchHistoryItem[];
  comments: Comment[];
  mediaNotes: Record<number, Note[]>;
  episodeNotes: Record<number, Record<number, Record<number, string>>>;
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

export interface CalendarItem {
  id: number;
  media_type: 'tv' | 'movie';
  poster_path: string | null;
  still_path?: string | null;
  title: string;
  date: string;
  episodeInfo: string;
  network?: string;
  overview?: string | null;
  runtime?: number | null;
  airtime?: string;
  isInCollection?: boolean;
}

export interface NewlyPopularEpisode {
  showInfo: TrackedItem;
  episode: Episode;
}

export interface Reminder {
  id: string;
  mediaId: number;
  mediaType: 'tv' | 'movie';
  releaseDate: string | null; // null or "TBD" if unknown
  title: string;
  poster_path: string | null;
  episodeInfo?: string; // e.g. "S1 E5"
  seasonNumber?: number;
  episodeNumber?: number;
  reminderType: ReminderType;
  wasDateUnknown: boolean;
}

export type ReminderType = 'release' | 'day_before' | 'week_before';

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

export interface TraktToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

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

export interface CustomImagePaths {
  [mediaId: number]: {
    poster_path?: string | null;
    backdrop_path?: string | null;
  };
}

/**
 * Interface representing a TMDB Collection.
 */
export interface TmdbCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TmdbMedia[];
}

/**
 * Interface representing a TVDB Show.
 */
export interface TvdbShow {
    id: number;
    name: string;
    artworks?: { type: number; image: string }[];
}

/**
 * Interface representing an Episode Tag.
 */
export interface EpisodeTag {
  text: string;
  className: string;
}

/**
 * Difficulty levels for achievements.
 */
export type AchievementDifficulty = 'Easy' | 'Medium' | 'Hard';

/**
 * Interface representing a system achievement.
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  difficulty: AchievementDifficulty;
  check: (data: UserData, stats: CalculatedStats) => { progress: number; goal: number };
}

/**
 * Interface representing a user's status for a specific achievement.
 */
export interface UserAchievementStatus extends Achievement {
  unlocked: boolean;
  progress: number;
  goal: number;
}

/**
 * Interface representing a TVDB authentication token.
 */
export interface TvdbToken {
    token: string;
    expiry: number;
}

/**
 * Interface representing a related show from TVDB.
 */
export interface TvdbRelatedShow {
    id: number;
    typeName: string;
}

/**
 * Interface representing a watched movie item from Trakt.
 */
export interface TraktWatchedMovie {
    plays: number;
    last_watched_at: string;
    movie: {
        title: string;
        ids: { tmdb: number };
    };
}

/**
 * Interface representing a watched TV show item from Trakt.
 */
export interface TraktWatchedShow {
    plays: number;
    last_watched_at: string;
    show: {
        title: string;
        ids: { tmdb: number };
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

/**
 * Interface representing a watchlist item from Trakt.
 */
export interface TraktWatchlistItem {
    type: 'movie' | 'show';
    movie?: { title: string; ids: { tmdb: number } };
    show?: { title: string; ids: { tmdb: number } };
}

/**
 * Interface representing a media rating from Trakt.
 */
export interface TraktRating {
    type: 'movie' | 'show' | 'season' | 'episode';
    rating: number;
    rated_at: string;
    movie?: { title: string; ids: { tmdb: number } };
    show?: { title: string; ids: { tmdb: number } };
}

/**
 * Interface representing a TV show episode in a Trakt calendar.
 */
export interface TraktCalendarShow {
    first_aired: string;
    episode: { season: number; number: number; title: string };
    show: { title: string; ids: { tmdb: number } };
}

/**
 * Interface representing a movie release in a Trakt calendar.
 */
export interface TraktCalendarMovie {
    released: string;
    movie: { title: string; ids: { tmdb: number } };
}

/**
 * Interface representing a season completion event for the log.
 */
export interface SeasonLogItem {
    showId: number;
    showTitle: string;
    posterPath: string | null;
    seasonNumber: number;
    seasonName: string;
    completionDate: string;
    userStartDate: string | null;
    premiereDate: string | null;
    endDate: string | null;
}

/**
 * Interface representing a full season drop event.
 */
export interface FullSeasonDrop {
    showId: number;
    showTitle: string;
    seasonName: string;
    poster_path: string | null;
    airtime: string;
    network: string;
    episodes: Episode[];
}

/**
 * Possible types of user activity.
 */
export type ActivityType = 'WATCHED_EPISODE' | 'WATCHED_MOVIE' | 'RATED_ITEM' | 'CREATED_LIST';

/**
 * Interface representing a single unit of user activity.
 */
export interface Activity {
    user: PublicUser;
    timestamp: string;
    type: ActivityType;
    media?: TrackedItem;
    episodeInfo?: string;
    rating?: number;
    listName?: string;
}

/**
 * Interface representing the activity feed for a specific friend/user.
 */
export interface FriendActivity {
    user: PublicUser;
    activities: Activity[];
}

/**
 * Interface for an episode that includes its airtime.
 */
export interface EpisodeWithAirtime extends Episode {
    airtime: string;
}
