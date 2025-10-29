import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, clearMediaCache, getCollectionDetails } from '../services/tmdbService';
import { getTvdbShowExtended } from '../services/tvdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, TvdbShow, WatchProviderResponse, TmdbCollection, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo, TmdbMedia, EpisodeRatings, Comment } from '../types';
import { ChevronLeftIcon, BookOpenIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, PlayCircleIcon, HeartIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, ChevronRightIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, QuestionMarkCircleIcon, CalendarIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP_LARGE } from '../constants';
import SeasonAccordion from './SeasonAccordion';
import JournalModal from './JournalModal';
import ImageSelectorModal from './ImageSelectorModal';
import CastAndCrew from './CastAndCrew';
import MoreInfo from './MoreInfo';
import RecommendedMedia from './RecommendedMedia';
import CustomizeTab from './CustomizeTab';
import WhereToWatch from './WhereToWatch';
import MovieCollection from './MovieCollection';
import PageChangeRequest from './PageChangeRequest';
import RatingModal from './RatingModal';
import EpisodeDetailModal from './EpisodeDetailModal';
import { formatRuntime, isNewRelease } from '../utils/formatUtils';
import NextUpWidget from './NextUpWidget';
import HistoryModal from './HistoryModal';
import CommentModal from './CommentModal';
import FavoriteAnimation from './FavoriteAnimation';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import MarkAsWatchedModal from './MarkAsWatchedModal';

// --- PROPS INTERFACE ---
interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  isModal?: boolean;
  onBack: () => void;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  trackedLists: { watching: TrackedItem[], planToWatch: TrackedItem[], completed: TrackedItem[], onHold: TrackedItem[], dropped: TrackedItem[] };
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  customImagePaths: CustomImagePaths;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  favorites: TrackedItem[];
  onToggleFavoriteShow: (item: TrackedItem) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenCustomListModal: (item: TmdbMedia | TrackedItem) => void;
  ratings: UserRatings;
  onRateItem: (mediaId: number, rating: number) => void;
  onMarkMediaAsWatched: (item: TmdbMedia | TrackedItem, date?: string) => void;
  onUnmarkMovieWatched: (mediaId: number, mediaType: 'movie') => void;
  onMarkSeasonWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
  onUnmarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  onMarkPreviousEpisodesWatched: (showId: number, seasonNumber: number, lastEpisodeNumber: number) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onSelectPerson: (personId: number) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onDeleteHistoryItem: (logId: string) => void;
  onClearMediaHistory: (mediaId: number, mediaType: 'tv' | 'movie') => void;
  episodeRatings: EpisodeRatings;
  onRateEpisode: (showId: number, seasonNumber: number, episodeNumber: number, rating: number) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string) => void;
  onSaveComment: (mediaKey: string, text: string) => void;
  comments: Comment[];
  onMarkRemainingWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
  genres: Record<number, string>;
}

type ShowDetailTab = 'seasons' | 'cast' | 'moreInfo' | 'recommendations' | 'watch' | 'customize';

// --- LOCAL COMPONENTS ---
const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean; isActive?: boolean; }> = ({ icon, label, onClick, disabled, isActive }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center space-y-1 w-full h-full p-2 rounded-lg border transition-all ${disabled ? 'text-text-secondary/50 cursor-not-allowed bg-bg-secondary/30 border-bg-secondary' : (isActive ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg' : 'bg-bg-secondary border border-bg-secondary/80 text-text-primary hover:border-primary-accent hover:bg-bg-secondary/70')}`}
    >
        {icon}
        <span className="text-xs font-semibold text-center">{label}</span>
    </button>
);

const StatusSelector: React.FC<{ currentStatus: WatchStatus | null; onUpdateStatus: (newStatus: WatchStatus | null) => void;}> = ({ currentStatus, onUpdateStatus }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const statuses: { id: WatchStatus, label: string }[] = [
        { id: 'watching', label: 'Watching' },
        { id: 'planToWatch', label: 'Plan to Watch' },
        { id: 'completed', label: 'Completed' },
        { id: 'onHold', label: 'On Hold' },
        { id: 'dropped', label: 'Dropped' },
    ];
    
    const currentLabel = statuses.find(s => s.id === currentStatus)?.label || "Add to Library";
    
    const handleSelect = (status: WatchStatus | null) => {
        onUpdateStatus(status);
        setIsOpen(false);
    }
    
    return (
        <div className="relative w-full h-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                className={`flex items-center justify-center space-x-2 w-full h-full px-4 py-2 rounded-lg border transition-all text-sm font-semibold ${currentStatus ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg' : 'bg-bg-secondary border border-bg-secondary/80 text-text-primary hover:border-primary-accent'}`}
            >
                <span>{currentLabel}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div 
                    className="absolute bottom-full left-0 w-full mb-2 bg-bg-primary border border-bg-secondary rounded-lg shadow-2xl z-10"
                >
                    <ul className="py-1">
                        {statuses.map(status => (
                            <li key={status.id}>
                                <button
                                    onClick={() => handleSelect(status.id)}
                                    className={`w-full text-left px-4 py-2 text-sm ${currentStatus === status.id ? 'font-bold text-primary-accent bg-bg-secondary' : 'text-text-primary hover:bg-bg-secondary'}`}
                                >
                                    {status.label}
                                </button>
                            </li>
                        ))}
                        {currentStatus && (
                            <>
                                <div className="my-1 border-t border-bg-secondary"></div>
                                <li>
                                    <button onClick={() => handleSelect(null)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">
                                        Remove from Library
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- SKELETON LOADER ---
const ShowDetailSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="w-full h-60 sm:h-80 md:h-96 bg-bg-secondary rounded-lg"></div>
        <div className="container mx-auto px-4 -mt-20">
            <div className="flex flex-col items-end">
                <div className="w-32 h-48 sm:w-48 sm:h-72 bg-bg-secondary rounded-lg shadow-lg flex-shrink-0 border-4 border-bg-primary"></div>
                <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                    <div className="h-8 bg-bg-secondary rounded w-3/4"></div>
                    <div className="h-4 bg-bg-secondary rounded w-1/2 mt-2"></div>
                </div>
            </div>
        </div>
        <div className="container mx-auto px-4 mt-8 space-y-4">
            <div className="h-10 bg-bg-secondary rounded w-full"></div>
            <div className="h-40 bg-bg-secondary rounded w-full"></div>
            <div className="h-40 bg-bg-secondary rounded w-full"></div>
        </div>
    </div>
);

const validateMediaDetails = (data: Partial<TmdbMediaDetails> | null, mediaType: 'tv' | 'movie'): TmdbMediaDetails => {
    const safeData = data || {};
    const title = safeData.title || safeData.name || "Untitled";
    const today = new Date().toISOString().split('T')[0];
    
    return {
        id: safeData.id || 0,
        media_type: mediaType,
        poster_path: safeData.poster_path || null,
        title: title,
        name: title,
        backdrop_path: safeData.backdrop_path || null,
        release_date: safeData.release_date,
        first_air_date: safeData.first_air_date,
        genre_ids: safeData.genre_ids,
        overview: safeData.overview || "No description available.",
        popularity: safeData.popularity,
        rating: safeData.rating,
        genres: (Array.isArray(safeData.genres) ? safeData.genres : []).filter(Boolean),
        number_of_seasons: safeData.number_of_seasons,
        number_of_episodes: safeData.number_of_episodes,
        seasons: (Array.isArray(safeData.seasons) ? safeData.seasons : []).filter(s => s && (!s.air_date || s.air_date <= today)),
        runtime: safeData.runtime,
        episode_run_time: safeData.episode_run_time,
        status: safeData.status,
        images: {
            backdrops: (Array.isArray(safeData.images?.backdrops) ? safeData.images.backdrops : []).filter(Boolean),
            posters: (Array.isArray(safeData.images?.posters) ? safeData.images.posters : []).filter(Boolean),
        },
        external_ids: safeData.external_ids,
        vote_average: safeData.vote_average ?? 0,
        vote_count: safeData.vote_count ?? 0,
        credits: {
            cast: (Array.isArray(safeData.credits?.cast) ? safeData.credits.cast : []).filter(Boolean),
            crew: (Array.isArray(safeData.credits?.crew) ? safeData.credits.crew : []).filter(Boolean),
        },
        recommendations: {
            results: (Array.isArray(safeData.recommendations?.results) ? safeData.recommendations.results : []).filter(Boolean),
        },
        videos: {
            results: (Array.isArray(safeData.videos?.results) ? safeData.videos.results : []).filter(Boolean),
        },
        belongs_to_collection: safeData.belongs_to_collection ?? null,
        last_episode_to_air: safeData.last_episode_to_air,
        next_episode_to_air: safeData.next_episode_to_air,
        production_companies: safeData.production_companies,
        origin_country: safeData.origin_country,
        original_language: safeData.original_language,
        tagline: safeData.tagline,
        budget: safeData.budget,
        revenue: safeData.revenue,
        homepage: safeData.homepage
    };
};


// --- MAIN COMPONENT ---
const ShowDetail: React.FC<ShowDetailProps> = (props) => {
  const {
    id, mediaType, isModal = false, onBack, watchProgress, history, onToggleEpisode, onSaveJournal, trackedLists, onUpdateLists,
    customImagePaths, onSetCustomImage, favorites, onToggleFavoriteShow, onSelectShow, onOpenCustomListModal, ratings, onRateItem, onMarkMediaAsWatched, onUnmarkMovieWatched, onMarkSeasonWatched, onUnmarkSeasonWatched,
    onMarkPreviousEpisodesWatched, favoriteEpisodes, onToggleFavoriteEpisode, onSelectPerson, onStartLiveWatch, onDeleteHistoryItem, onClearMediaHistory, episodeRatings, onRateEpisode, onAddWatchHistory, onSaveComment, comments, onMarkRemainingWatched, genres
  } = props;

  // --- STATE MANAGEMENT ---
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
  const [tvdbDetails, setTvdbDetails] = useState<TvdbShow | null>(null);
  const [seasonDetailsMap, setSeasonDetailsMap] = useState<Record<number, TmdbSeasonDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ShowDetailTab>(mediaType === 'tv' ? 'seasons' : 'cast');
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({});
  const [journalModalState, setJournalModalState] = useState<{ isOpen: boolean; season?: number; episode?: Episode }>({ isOpen: false });
  const [imageSelectorModalOpen, setImageSelectorModalOpen] = useState(false);
  const [watchProviders, setWatchProviders] = useState<WatchProviderResponse | null>(null);
  const [collectionDetails, setCollectionDetails] = useState<TmdbCollection | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [episodeDetailModalState, setEpisodeDetailModalState] = useState<{isOpen: boolean, episode: Episode | null}>({isOpen: false, episode: null});
  const [episodeRatingModalState, setEpisodeRatingModalState] = useState<{isOpen: boolean, episode: Episode | null}>({isOpen: false, episode: null});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState<string | null>(null);
  const [isAnimatingFavorite, setIsAnimatingFavorite] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'up' | 'down'>('up');
  const [markAsWatchedModalOpen, setMarkAsWatchedModalOpen] = useState(false);

  // --- DERIVED STATE & MEMOIZED VALUES ---
  const customPosterPath = customImagePaths[id]?.poster_path;
  const customBackdropPath = customImagePaths[id]?.backdrop_path;
  const isFavorited = favorites.some(fav => fav.id === id);
  const currentStatus = useMemo(() => {
    for (const listName in trackedLists) {
        if (trackedLists[listName as WatchStatus].some(item => item.id === id)) {
            return listName as WatchStatus;
        }
    }
    return null;
  }, [trackedLists, id]);
  const userRating = ratings[id]?.rating || 0;
  
  const nextEpisodeToWatch = useMemo(() => {
    if (mediaType !== 'tv' || !details || !details.seasons) return null;
    const progressForShow = watchProgress[id] || {};
    const sortedSeasons = [...details.seasons].filter(s => s.season_number > 0).sort((a,b) => a.season_number - b.season_number);
    for (const season of sortedSeasons) {
      for (let i = 1; i <= season.episode_count; i++) {
        if (progressForShow[season.season_number]?.[i]?.status !== 2) {
          return { seasonNumber: season.season_number, episodeNumber: i };
        }
      }
    }
    return null;
  }, [mediaType, details, watchProgress, id]);
  
  const sortedPosters = useMemo(() => 
      details?.images?.posters ? [...details.images.posters].sort((a,b) => b.vote_average - a.vote_average) : [],
  [details?.images?.posters]);

  const showStatus = useMemo(() => {
    if (!details || details.media_type !== 'tv') return null;
    const badgeClass = 'bg-red-800 text-white'; // Dark red with white font for all statuses

    // Highest priority: API says it's ended/canceled
    if (details.status === 'Ended' || details.status === 'Canceled') {
        return { text: 'Status: Ended', color: badgeClass };
    }

    const lastAiredEpisode = details.last_episode_to_air;
    if (lastAiredEpisode) {
        const lastSeasonInfo = details.seasons?.find(s => s.season_number === lastAiredEpisode.season_number);
        // We don't have full season details here, so the tag utility has to be robust. It is.
        const tag = getEpisodeTag(lastAiredEpisode, lastSeasonInfo, details, undefined);

        // Per user request: if last aired episode is a series finale, it's "Ended"
        if (tag?.text === 'Series Finale') {
            return { text: 'Status: Ended', color: badgeClass };
        }

        // Per user request: if last aired episode is a season finale, it's "Ongoing/Off Season"
        if (tag?.text === 'Season Finale') {
            return { text: 'Status: Ongoing/Off Season', color: badgeClass };
        }
    }
    
    // If no finale tag on last episode, and it's a continuing series, it must be In Season
    if (['Returning Series', 'In Production', 'Pilot'].includes(details.status || '')) {
       return { text: 'Status: Ongoing/In Season', color: badgeClass };
    }
    
    // Fallback for shows that are between seasons but not officially "Ended" yet
    // and don't have a clear "Returning Series" status.
    return { text: 'Status: Ongoing/Off Season', color: badgeClass };
  }, [details]);
  
    const runtimeDisplay = useMemo(() => {
        if (mediaType === 'movie') {
            return formatRuntime(details?.runtime);
        }
        if (mediaType === 'tv') {
            const runtimes = (details?.episode_run_time || []).filter(t => t > 0);
            if (runtimes.length === 0) return null;
            if (runtimes.length === 1) return formatRuntime(runtimes[0]);
            const min = Math.min(...runtimes);
            const max = Math.max(...runtimes);
            if (min === max) return formatRuntime(min);
            return `${formatRuntime(min)} - ${formatRuntime(max)}`;
        }
        return null;
    }, [details, mediaType]);


  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const [tmdbData, providersData] = await Promise.all([
            getMediaDetails(id, mediaType),
            getWatchProviders(id, mediaType).catch(() => null)
        ]);
        
        const validatedDetails = validateMediaDetails(tmdbData, mediaType);
        setDetails(validatedDetails);
        setWatchProviders(providersData);

        if (mediaType === 'tv' && validatedDetails.external_ids?.tvdb_id) {
            getTvdbShowExtended(validatedDetails.external_ids.tvdb_id)
                .then(setTvdbDetails)
                .catch(e => console.error("Failed to fetch TVDB details", e));
        }
        if (mediaType === 'movie' && validatedDetails.belongs_to_collection) {
            getCollectionDetails(validatedDetails.belongs_to_collection.id)
                .then(setCollectionDetails)
                .catch(e => console.error("Failed to fetch collection details", e));
        }
        
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  }, [id, mediaType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchSeasonDetails = useCallback(async (seasonNumber: number) => {
    if (mediaType !== 'tv' || seasonDetailsMap[seasonNumber]) return;
    try {
        const data = await getSeasonDetails(id, seasonNumber);
        setSeasonDetailsMap(prev => ({ ...prev, [seasonNumber]: data }));
    } catch (error) {
        console.error(`Failed to fetch season ${seasonNumber}`, error);
    }
  }, [id, mediaType, seasonDetailsMap]);

  const backdropSrcs = useMemo(() => {
    const allBackdrops = (details?.images?.backdrops || []).filter(img => img.file_path);
    if (allBackdrops.length === 0) {
        return [customBackdropPath, details?.backdrop_path, collectionDetails?.backdrop_path]
            .filter((p): p is string => !!p)
            .map(p => getImageUrl(p, 'w1280'));
    }

    const idealRatio = 16 / 9;
    const tolerance = 0.2;

    const idealImages = allBackdrops
        .filter(img => Math.abs(img.aspect_ratio - idealRatio) < tolerance)
        .sort((a, b) => b.vote_count - a.vote_count);

    const otherImages = allBackdrops
        .filter(img => Math.abs(img.aspect_ratio - idealRatio) >= tolerance)
        .sort((a, b) => b.vote_count - a.vote_count);
    
    const sortedImagePaths = [...idealImages, ...otherImages].map(img => img.file_path);

    const prioritizedPaths = [
        customBackdropPath,
        details?.backdrop_path,
        ...sortedImagePaths,
        collectionDetails?.backdrop_path,
    ];

    const uniquePaths = Array.from(new Set(prioritizedPaths.filter((p): p is string => !!p)));

    return uniquePaths.map(p => getImageUrl(p, 'w1280'));
  }, [details, customBackdropPath, collectionDetails]);

  // --- EVENT HANDLERS ---
  const handleToggleSeason = (seasonNumber: number) => {
    const isCurrentlyExpanded = !!expandedSeasons[seasonNumber];
    if (!isCurrentlyExpanded) {
        fetchSeasonDetails(seasonNumber);
    }
    setExpandedSeasons(prev => ({ ...prev, [seasonNumber]: !isCurrentlyExpanded }));
  };
  
  const handleOpenJournal = (season?: number, episode?: Episode) => {
    setJournalModalState({ isOpen: true, season, episode });
  };
  
  const handleOpenEpisodeDetail = (episode: Episode) => {
    setEpisodeDetailModalState({ isOpen: true, episode });
  };
  
  const handleEpisodeNav = (direction: 'next' | 'prev') => {
    const currentEpisode = episodeDetailModalState.episode;
    if (!currentEpisode || !details || !details.seasons) return;
    const currentSeason = seasonDetailsMap[currentEpisode.season_number];
    if (!currentSeason) return;
    const currentIndex = currentSeason.episodes.findIndex(e => e.id === currentEpisode.id);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < currentSeason.episodes.length) {
      setEpisodeDetailModalState({ isOpen: true, episode: currentSeason.episodes[newIndex] });
    }
  };

  const handleUpdateStatus = (newStatus: WatchStatus | null) => {
    if (!details) return;
    const item: TrackedItem = {
      id: details.id,
      title: details.title || details.name || 'Untitled',
      media_type: mediaType,
      poster_path: details.poster_path,
      genre_ids: details.genres?.map(g => g.id),
    };
    onUpdateLists(item, currentStatus, newStatus);
  };
  
  const handleRefreshData = () => {
    clearMediaCache(id, mediaType);
    fetchData();
  };
  
  const handleRateEpisode = (rating: number) => {
    if (episodeRatingModalState.episode) {
      onRateEpisode(id, episodeRatingModalState.episode.season_number, episodeRatingModalState.episode.episode_number, rating);
    }
    setEpisodeRatingModalState({ isOpen: false, episode: null });
  };

  const handleToggleFavoriteShowWithAnimation = () => {
    if (!isFavorited) { // is being favorited
        setAnimationDirection('up');
    } else { // is being unfavorited
        setAnimationDirection('down');
    }
    setIsAnimatingFavorite(false); // reset animation state
    setTimeout(() => {
        setIsAnimatingFavorite(true);
    }, 10);
    
    if (details) {
        onToggleFavoriteShow(details as TrackedItem);
    }
  };

  const handleSaveWatchedDate = (data: { date: string; note: string }) => {
    if (details && details.media_type === 'movie') {
        onAddWatchHistory(details as TrackedItem, undefined, undefined, data.date, data.note);
    }
    setMarkAsWatchedModalOpen(false);
  };

  const handleLiveWatchForMovie = () => {
    if (!details || details.media_type !== 'movie') return;
    const mediaInfo: LiveWatchMediaInfo = {
        id: details.id,
        media_type: 'movie',
        title: details.title || details.name || 'Untitled',
        poster_path: details.poster_path,
        runtime: details.runtime || 90, // Use a fallback runtime
    };
    onStartLiveWatch(mediaInfo);
  };
  
    const handleUnmarkWatched = () => {
        if(details && details.media_type === 'movie'){
            onUnmarkMovieWatched(details.id, 'movie');
        }
    };

  const mediaKey = mediaType === 'movie' ? `movie-${id}` : `tv-${id}`;
  const existingComment = comments.find(c => c.mediaKey === mediaKey);

  // --- RENDER LOGIC ---
  if (loading) return <ShowDetailSkeleton />;
  if (error || !details) return <div className="text-center py-20"><p className="text-red-500">{error || "Details not found."}</p><button onClick={onBack} className="mt-4 px-4 py-2 bg-bg-secondary rounded-lg">Back</button></div>;

  const { title, name, overview } = details;
  const displayTitle = title || name;
  const isNewMovie = mediaType === 'movie' && isNewRelease(details.release_date);
  
  const posterSrcs = [
      customPosterPath,
      ...sortedPosters.map(img => img.file_path),
      details.poster_path,
      tvdbDetails?.image,
  ].filter((p): p is string => !!p).map(p => getImageUrl(p, 'w342'));

  const tabs: { id: ShowDetailTab; label: string; condition: boolean }[] = [
    { id: 'seasons', label: 'Seasons', condition: mediaType === 'tv' && !!details.seasons && details.seasons.length > 0 },
    { id: 'cast', label: 'Cast & Crew', condition: !!details.credits && (details.credits.cast.length > 0 || details.credits.crew.length > 0) },
    { id: 'watch', label: 'Where to Watch', condition: !!watchProviders && !!watchProviders.results.US },
    { id: 'moreInfo', label: 'More Info', condition: true },
    { id: 'recommendations', label: 'Recommendations', condition: !!details.recommendations && details.recommendations.results.length > 0 },
    { id: 'customize', label: 'Customize', condition: !!details.images && (details.images.posters.length > 0 || details.images.backdrops.length > 0) },
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'seasons': return (
        <div className="space-y-4">
            {details.seasons?.filter(s => s.season_number > 0).map(season => (
                <SeasonAccordion 
                    key={season.id} 
                    season={season}
                    showId={id} 
                    isExpanded={!!expandedSeasons[season.season_number]}
                    onToggle={() => handleToggleSeason(season.season_number)}
                    seasonDetails={seasonDetailsMap[season.season_number]}
                    watchProgress={watchProgress}
                    onToggleEpisode={(...args) => onToggleEpisode(args[0], args[1], args[2], args[3], details as TrackedItem, args[5])}
                    onMarkPreviousEpisodesWatched={(showId, seasonNumber, lastEp) => onMarkPreviousEpisodesWatched(showId, seasonNumber, lastEp)}
                    onOpenJournal={handleOpenJournal}
                    onOpenEpisodeDetail={handleOpenEpisodeDetail}
                    showDetails={details}
                    showPosterPath={details.poster_path}
                    tvdbShowPosterPath={tvdbDetails?.image}
                    onMarkSeasonWatched={(showId, seasonNum) => onMarkSeasonWatched(showId, seasonNum, details as TrackedItem)}
                    onUnmarkSeasonWatched={onUnmarkSeasonWatched}
                    favoriteEpisodes={favoriteEpisodes}
                    onToggleFavoriteEpisode={onToggleFavoriteEpisode}
                    onStartLiveWatch={onStartLiveWatch}
                    onSaveJournal={(showId, season, ep, entry) => onSaveJournal(showId, season, ep, entry ? entry : null)}
                    episodeRatings={episodeRatings}
                    onOpenEpisodeRatingModal={(ep) => setEpisodeRatingModalState({ isOpen: true, episode: ep })}
                    onAddWatchHistory={onAddWatchHistory}
                    onSaveComment={onSaveComment}
                    comments={comments}
                    onImageClick={setImageViewerSrc}
                />
            ))}
        </div>
      );
      case 'cast': return <CastAndCrew details={details} tvdbDetails={tvdbDetails} onSelectPerson={onSelectPerson} />;
      case 'watch': return <WhereToWatch providers={watchProviders} />;
      case 'moreInfo': return <MoreInfo details={details} />;
      case 'recommendations': return <RecommendedMedia recommendations={details.recommendations!.results} onSelectShow={onSelectShow} />;
      case 'customize': return <CustomizeTab posterUrl={getImageUrl(customPosterPath || details.poster_path, 'w342')} backdropUrl={getImageUrl(customBackdropPath || details.backdrop_path, 'w780')} onOpenImageSelector={() => setImageSelectorModalOpen(true)} />;
      default: return null;
    }
  };
  
    const isCompleted = currentStatus === 'completed';

  // --- FINAL RENDER ---
  return (
    <>
      <MarkAsWatchedModal
        isOpen={markAsWatchedModalOpen}
        onClose={() => setMarkAsWatchedModalOpen(false)}
        mediaTitle={displayTitle || ''}
        onSave={handleSaveWatchedDate}
      />
      <JournalModal isOpen={journalModalState.isOpen} onClose={() => setJournalModalState({ isOpen: false })} onSave={(entry, s, e) => onSaveJournal(id, s, e, entry)} mediaDetails={details} initialSeason={journalModalState.season} initialEpisode={journalModalState.episode} watchProgress={watchProgress} />
      <ImageSelectorModal isOpen={imageSelectorModalOpen} onClose={() => setImageSelectorModalOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => onSetCustomImage(id, type, path)} />
      <RatingModal isOpen={ratingModalOpen} onClose={() => setRatingModalOpen(false)} onSave={(rating) => onRateItem(id, rating)} currentRating={userRating} mediaTitle={displayTitle || ''} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={history.filter(h => h.id === id)} mediaTitle={displayTitle || ''} onDeleteHistoryItem={onDeleteHistoryItem} onClearMediaHistory={onClearMediaHistory} mediaDetails={details} />
      <CommentModal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} mediaTitle={displayTitle || ''} initialText={existingComment?.text} onSave={(text) => onSaveComment(mediaKey, text)} />

      {imageViewerSrc && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImageViewerSrc(null)}>
              <img src={imageViewerSrc} alt="Season Poster" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
      )}

      {episodeDetailModalState.episode && (
        <EpisodeDetailModal 
            isOpen={episodeDetailModalState.isOpen}
            onClose={() => setEpisodeDetailModalState({isOpen: false, episode: null})}
            episode={episodeDetailModalState.episode}
            showDetails={details}
            seasonDetails={seasonDetailsMap[episodeDetailModalState.episode.season_number]}
            tvdbShowPosterPath={tvdbDetails?.image}
            isWatched={watchProgress[id]?.[episodeDetailModalState.episode.season_number]?.[episodeDetailModalState.episode.episode_number]?.status === 2}
            onToggleWatched={() => onToggleEpisode(id, episodeDetailModalState.episode!.season_number, episodeDetailModalState.episode!.episode_number, watchProgress[id]?.[episodeDetailModalState.episode.season_number]?.[episodeDetailModalState.episode.episode_number]?.status || 0, details, episodeDetailModalState.episode.name)}
            onOpenJournal={() => handleOpenJournal(episodeDetailModalState.episode?.season_number, episodeDetailModalState.episode!)}
            isFavorited={!!favoriteEpisodes[id]?.[episodeDetailModalState.episode.season_number]?.[episodeDetailModalState.episode.episode_number]}
            onToggleFavorite={() => onToggleFavoriteEpisode(id, episodeDetailModalState.episode!.season_number, episodeDetailModalState.episode!.episode_number)}
            onStartLiveWatch={onStartLiveWatch}
            onSaveJournal={(showId, season, ep, entry) => onSaveJournal(showId, season, ep, entry ? entry : null)}
            watchProgress={watchProgress}
            onNext={() => handleEpisodeNav('next')}
            onPrevious={() => handleEpisodeNav('prev')}
            onAddWatchHistory={onAddWatchHistory}
            onRate={() => setEpisodeRatingModalState({ isOpen: true, episode: episodeDetailModalState.episode })}
            episodeRating={episodeRatings[id]?.[episodeDetailModalState.episode.season_number]?.[episodeDetailModalState.episode.episode_number] || 0}
            onSaveComment={onSaveComment}
            comments={comments}
        />
      )}
      {episodeRatingModalState.episode && (
          <RatingModal
            isOpen={episodeRatingModalState.isOpen}
            onClose={() => setEpisodeRatingModalState({ isOpen: false, episode: null })}
            onSave={handleRateEpisode}
            currentRating={episodeRatings[id]?.[episodeRatingModalState.episode.season_number]?.[episodeRatingModalState.episode.episode_number] || 0}
            mediaTitle={`S${episodeRatingModalState.episode.season_number} E${episodeRatingModalState.episode.episode_number}: ${episodeRatingModalState.episode.name}`}
          />
      )}
      
      <div className={`animate-fade-in ${isModal ? 'max-w-4xl mx-auto' : ''}`}>
        {isAnimatingFavorite && (
            <FavoriteAnimation
                onAnimationEnd={() => setIsAnimatingFavorite(false)}
                genreId={details?.genres?.[0]?.id}
                posterPath={customPosterPath || details?.poster_path || null}
                genresMap={genres}
                direction={animationDirection}
            />
        )}
        {/* --- Backdrop and Header --- */}
        <div className="relative mb-8">
            <FallbackImage 
                srcs={backdropSrcs} 
                placeholder={PLACEHOLDER_BACKDROP_LARGE} 
                alt={`${displayTitle} backdrop`} 
                className="w-full h-60 sm:h-80 md:h-96 object-cover"
            />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent"></div>
          {!isModal && (
            <button onClick={onBack} className="fixed top-20 left-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-40">
                <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}
          {isModal && (
              <button onClick={onBack} className="absolute top-4 right-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-40">
                <XMarkIcon className="h-6 w-6" />
              </button>
          )}
        </div>
        
        {/* --- Title & Info Section --- */}
        <div className="container mx-auto px-4 -mt-24 sm:-mt-32 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
            <div className="flex-shrink-0">
                <FallbackImage 
                    srcs={posterSrcs} 
                    alt={`${displayTitle} poster`} 
                    className="w-48 sm:w-56 aspect-[2/3] object-cover rounded-lg shadow-xl border-4 border-bg-primary"
                />
            </div>
            <div className="w-full">
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">{displayTitle}</h1>
                 {isNewMovie && (
                    <div className="mt-2 flex justify-center sm:justify-start">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300">
                            New Release
                        </span>
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm text-text-secondary mt-2">
                    <span>{details.release_date?.substring(0, 4) || details.first_air_date?.substring(0, 4)}</span>
                    <span className="text-text-secondary/50">&bull;</span>
                    <span>{details.genres?.map(g => g.name).join(', ')}</span>
                    {runtimeDisplay && <>
                        <span className="text-text-secondary/50">&bull;</span>
                        <span>{runtimeDisplay}</span>
                    </>}
                </div>
                {showStatus && (
                    <div className="mt-2 flex justify-center sm:justify-start">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${showStatus.color}`}>
                            {showStatus.text}
                        </span>
                    </div>
                )}
            </div>
          </div>

          {/* --- Action Buttons --- */}
            <div className="mt-6 space-y-2">
                <div className="h-12">
                    <StatusSelector currentStatus={currentStatus} onUpdateStatus={handleUpdateStatus} />
                </div>
                {mediaType === 'movie' ? (
                    <>
                        <div className="grid grid-cols-4 gap-2">
                            <ActionButton
                                icon={<CheckCircleIcon className="w-7 h-7" />}
                                label={isCompleted ? "Unmark Watched" : "Mark Watched"}
                                onClick={isCompleted ? handleUnmarkWatched : () => onMarkMediaAsWatched(details as TrackedItem)}
                                isActive={isCompleted}
                            />
                            <ActionButton icon={<CalendarIcon className="w-7 h-7" />} label="Log Watch" onClick={() => setMarkAsWatchedModalOpen(true)} />
                            <ActionButton icon={<PlayCircleIcon className="w-7 h-7" />} label="Live Watch" onClick={handleLiveWatchForMovie} />
                            <ActionButton icon={<HeartIcon filled={isFavorited} className="w-7 h-7" />} label={isFavorited ? 'Favorited' : 'Favorite'} onClick={handleToggleFavoriteShowWithAnimation} isActive={isFavorited} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <ActionButton icon={<StarIcon filled={userRating > 0} className="w-7 h-7" />} label={userRating ? `Rated ${userRating}/5` : 'Rate'} onClick={() => setRatingModalOpen(true)} isActive={userRating > 0} />
                            <ActionButton icon={<BookOpenIcon className="w-7 h-7" />} label="Journal" onClick={() => handleOpenJournal()} />
                            <ActionButton icon={<ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />} label={existingComment ? 'View Comment' : 'Comment'} onClick={() => setIsCommentModalOpen(true)} isActive={!!existingComment}/>
                            <ActionButton icon={<ListBulletIcon className="w-7 h-7" />} label="Add to..." onClick={() => onOpenCustomListModal(details)} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                             <ActionButton icon={<ClockIcon className="w-7 h-7" />} label="History" onClick={() => setIsHistoryModalOpen(true)} />
                            <PageChangeRequest mediaTitle={displayTitle || ''} mediaId={id}/>
                            <ActionButton icon={<ArrowPathIcon className="w-7 h-7" />} label="Refresh" onClick={handleRefreshData} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-2">
                            <ActionButton icon={<HeartIcon filled={isFavorited} className="w-7 h-7" />} label={isFavorited ? 'Favorited' : 'Favorite'} onClick={handleToggleFavoriteShowWithAnimation} isActive={isFavorited} />
                            <ActionButton icon={<StarIcon filled={userRating > 0} className="w-7 h-7" />} label={userRating ? `Rated ${userRating}/5` : 'Rate'} onClick={() => setRatingModalOpen(true)} isActive={userRating > 0} />
                            <ActionButton icon={<BookOpenIcon className="w-7 h-7" />} label="Journal" onClick={() => handleOpenJournal()} />
                            <ActionButton icon={<ListBulletIcon className="w-7 h-7" />} label="Add to..." onClick={() => onOpenCustomListModal(details)} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <ActionButton icon={<ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />} label={existingComment ? 'View Comment' : 'Comment'} onClick={() => setIsCommentModalOpen(true)} isActive={!!existingComment}/>
                            <ActionButton icon={<ClockIcon className="w-7 h-7" />} label="History" onClick={() => setIsHistoryModalOpen(true)} />
                            <PageChangeRequest mediaTitle={displayTitle || ''} mediaId={id}/>
                            <ActionButton icon={<ArrowPathIcon className="w-7 h-7" />} label="Refresh" onClick={handleRefreshData} />
                        </div>
                    </>
                )}
            </div>
            
        </div>

        {/* --- Main Content Area --- */}
        <div className="container mx-auto px-4 mt-8">
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Overview</h2>
                <p className="text-text-secondary whitespace-pre-wrap">{overview || 'No description available.'}</p>
            </section>
            
            {nextEpisodeToWatch && (
              <div className="mb-8">
                <NextUpWidget showId={id} details={details} tvdbDetails={tvdbDetails} nextEpisodeToWatch={nextEpisodeToWatch} onToggleEpisode={(...args) => onToggleEpisode(args[0], args[1], args[2], args[3], details as TrackedItem, undefined)} onOpenJournal={handleOpenJournal} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={onToggleFavoriteEpisode} onStartLiveWatch={onStartLiveWatch} watchProgress={watchProgress} onSaveJournal={onSaveJournal} onSaveComment={onSaveComment} comments={comments} />
              </div>
            )}
            
            {collectionDetails && <MovieCollection collectionId={collectionDetails.id} currentMovieId={id} onSelectMovie={onSelectShow} />}

            <section>
              <div className="border-b border-bg-secondary/50 mb-6">
                  <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-2">
                      {tabs.filter(t => t.condition).map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors ${
                              activeTab === tab.id
                                ? 'bg-accent-gradient text-on-accent'
                                : 'bg-bg-secondary text-text-secondary hover:brightness-125'
                            }`}
                          >
                              {tab.label}
                          </button>
                      ))}
                  </div>
              </div>
              {renderTabContent()}
            </section>
        </div>
      </div>
    </>
  );
};

export default ShowDetail;