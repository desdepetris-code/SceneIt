import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, clearMediaCache, getCollectionDetails } from '../services/tmdbService';
import { getTvdbShowExtended } from '../services/tvdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, TvdbShow, WatchProviderResponse, TmdbCollection, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo, TmdbMedia, EpisodeRatings, Comment } from '../types';
import { ChevronLeftIcon, BookOpenIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, PlayCircleIcon, HeartIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, ChevronRightIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon } from './Icons';
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
import { formatRuntime } from '../utils/formatUtils';
import NextUpWidget from './NextUpWidget';
import HistoryModal from './HistoryModal';
import CommentModal from './CommentModal';

// --- PROPS INTERFACE ---
interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  isModal?: boolean;
  onBack: () => void;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem) => void;
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
  onMarkAllWatched: (showId: number, showInfo: TrackedItem) => void;
  onMarkSeasonWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
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
}

type ShowDetailTab = 'seasonDescription' | 'overview' | 'cast' | 'moreInfo' | 'recommendations' | 'watch' | 'customize' | 'recentlyAired';

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
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                className={`flex items-center justify-center space-x-2 w-full h-full p-2 rounded-lg border transition-all text-sm font-semibold ${currentStatus ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg' : 'bg-bg-secondary border border-bg-secondary/80 text-text-primary hover:border-primary-accent'}`}
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
            <div className="flex flex-col sm:flex-row items-end">
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
    const { id, mediaType, isModal, onBack, watchProgress, history, onToggleEpisode, onSaveJournal, trackedLists, onUpdateLists, customImagePaths, onSetCustomImage, favorites, onToggleFavoriteShow, onSelectShow, onOpenCustomListModal, ratings, onRateItem, onMarkAllWatched, onMarkSeasonWatched, onMarkPreviousEpisodesWatched, favoriteEpisodes, onToggleFavoriteEpisode, onSelectPerson, onStartLiveWatch, onDeleteHistoryItem, onClearMediaHistory, episodeRatings, onRateEpisode, onAddWatchHistory, onSaveComment, comments } = props;

    // --- STATE MANAGEMENT ---
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [tvdbDetails, setTvdbDetails] = useState<TvdbShow | null>(null);
    const [providers, setProviders] = useState<WatchProviderResponse | null>(null);
    const [seasonDetailsCache, setSeasonDetailsCache] = useState<Record<number, TmdbSeasonDetails>>({});
    const [collectionDetails, setCollectionDetails] = useState<TmdbCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [journalState, setJournalState] = useState<{ isOpen: boolean; season?: number; episode?: Episode }>({ isOpen: false });
    const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [episodeRatingModalState, setEpisodeRatingModalState] = useState<{ isOpen: boolean, episode: Episode | null}>({ isOpen: false, episode: null });
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [episodeDetailState, setEpisodeDetailState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });
    const [isLiveWatchLoading, setIsLiveWatchLoading] = useState(false);

    const [activeSeasonTab, setActiveSeasonTab] = useState<number | null>(null);
    
    const isRecent = useMemo(() => {
        if (!details) return { movie: false, tv: false };
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        if (mediaType === 'movie' && details.release_date) {
            const releaseDate = new Date(details.release_date + 'T00:00:00');
            return { movie: releaseDate >= sevenDaysAgo && releaseDate <= today, tv: false };
        }
        if (mediaType === 'tv' && details.last_episode_to_air?.air_date) {
            const airDate = new Date(details.last_episode_to_air.air_date + 'T00:00:00');
            return { movie: false, tv: airDate >= sevenDaysAgo && airDate <= today };
        }
        return { movie: false, tv: false };
    }, [details, mediaType]);
    
    const defaultTab = mediaType === 'tv' ? 'seasonDescription' : 'overview';
    const [activeTab, setActiveTab] = useState<ShowDetailTab>(defaultTab);

    // --- DATA FETCHING AND VALIDATION ---
    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        if(forceRefresh) clearMediaCache(id, mediaType);
        
        try {
            const [tmdbData, providerData] = await Promise.all([
                getMediaDetails(id, mediaType),
                getWatchProviders(id, mediaType).catch(() => null)
            ]);
            
            const validatedData = validateMediaDetails(tmdbData, mediaType);
            setDetails(validatedData);
            setProviders(providerData);

            if (mediaType === 'movie' && validatedData.belongs_to_collection) {
                getCollectionDetails(validatedData.belongs_to_collection.id).then(setCollectionDetails).catch(e => console.warn("Could not fetch collection details:", e));
            } else {
                setCollectionDetails(null);
            }

            if (mediaType === 'tv' && validatedData.external_ids?.tvdb_id) {
                getTvdbShowExtended(validatedData.external_ids.tvdb_id).then(setTvdbDetails).catch(e => console.warn("Could not fetch TVDB details:", e));
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to load details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [id, mediaType]);

    useEffect(() => {
        fetchData();
        setActiveTab(mediaType === 'tv' ? 'seasonDescription' : 'overview');
    }, [fetchData, mediaType]);
    
    // --- MEMOIZED VALUES ---
    const mediaKey = useMemo(() => `${mediaType}-${id}`, [mediaType, id]);
    const showComment = useMemo(() => comments.find(c => c.mediaKey === mediaKey), [comments, mediaKey]);
    
    const displayStatus = useMemo(() => {
        if (!details) return 'Unknown';
        if (details.media_type === 'movie') return details.status || 'Unknown';
        
        const { status, last_episode_to_air, next_episode_to_air } = details;

        if (status === 'Ended' || status === 'Cancelled') {
            return status;
        }

        if (status === 'Returning Series') {
            const now = new Date().getTime();
            
            if (next_episode_to_air?.air_date) {
                const nextAirDate = new Date(next_episode_to_air.air_date).getTime();
                if (nextAirDate > now - 7 * 24 * 60 * 60 * 1000 && nextAirDate < 270 * 24 * 60 * 60 * 1000) {
                    return 'Ongoing / In Season';
                }
            }
            
            if (last_episode_to_air?.air_date) {
                const lastAirDate = new Date(last_episode_to_air.air_date).getTime();
                if (now - lastAirDate < 120 * 24 * 60 * 60 * 1000) {
                    return 'Ongoing / In Season';
                }
            }
            return 'Ongoing / Off Season';
        }

        return status || 'Unknown';
    }, [details]);
    
    const customPoster = customImagePaths[id]?.poster_path;
    const customBackdrop = customImagePaths[id]?.backdrop_path;
    
    const currentList = useMemo((): WatchStatus | null => {
        if (trackedLists.watching.some(i => i.id === id)) return 'watching';
        if (trackedLists.planToWatch.some(i => i.id === id)) return 'planToWatch';
        if (trackedLists.completed.some(i => i.id === id)) return 'completed';
        if (trackedLists.onHold.some(i => i.id === id)) return 'onHold';
        if (trackedLists.dropped.some(i => i.id === id)) return 'dropped';
        return null;
    }, [trackedLists, id]);
    
    const trackedItem: TrackedItem | null = useMemo(() => {
        if (!details) return null;
        return { id: details.id, title: details.title || details.name || 'Untitled', media_type: details.media_type, poster_path: details.poster_path, genre_ids: details.genres.map(g => g.id) }
    }, [details]);

    const isShowFavorited = useMemo(() => favorites.some(i => i.id === id), [favorites, id]);
    const userRating = useMemo(() => ratings[id]?.rating || 0, [ratings, id]);
    
    const nextEpisodeToWatch = useMemo(() => {
        if (mediaType !== 'tv' || !details?.seasons) {
            return null;
        }
        const progressForShow = watchProgress[id] || {};
        const sortedSeasons = [...details.seasons]
            .filter(s => s.season_number > 0)
            .sort((a, b) => a.season_number - b.season_number);
        
        for (const season of sortedSeasons) {
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status !== 2) {
                    return { seasonNumber: season.season_number, episodeNumber: i };
                }
            }
        }
        return null;
    }, [details, id, mediaType, watchProgress]);
    
    const posterSrcs = useMemo(() => {
        const paths = mediaType === 'tv'
            ? [
                customPoster,
                details?.poster_path,
                tvdbDetails?.image // This is a full URL, getImageUrl handles it
            ]
            : [
                customPoster,
                details?.poster_path
            ];
        
        return paths.filter(p => !!p).map(p => getImageUrl(p, 'w500'));
    }, [mediaType, customPoster, details, tvdbDetails]);

    const historyForMedia = useMemo(() => history.filter(h => h.id === id), [history, id]);

    const allSeasonsSorted = useMemo(() => {
        if (!details?.seasons) return [];
        const specials = details.seasons.filter(s => s.season_number === 0);
        const regulars = details.seasons.filter(s => s.season_number > 0).sort((a, b) => a.season_number - b.season_number);
        return [...regulars, ...specials];
    }, [details?.seasons]);


    // --- EVENT HANDLERS ---
    const handleSelectSeason = useCallback((seasonNumber: number) => {
        setActiveSeasonTab(seasonNumber);
        if (!seasonDetailsCache[seasonNumber]) {
            getSeasonDetails(id, seasonNumber)
                .then(data => {
                    setSeasonDetailsCache(prev => ({...prev, [seasonNumber]: data}));
                })
                .catch(e => console.error("Failed to fetch season details for tab", e));
        }
    }, [id, seasonDetailsCache]);

    useEffect(() => {
        if (details && mediaType === 'tv' && activeSeasonTab === null && allSeasonsSorted.length > 0 && activeTab !== 'recentlyAired') {
            let initialSeasonNumber: number | null = null;
            if (nextEpisodeToWatch) {
                initialSeasonNumber = nextEpisodeToWatch.seasonNumber;
            } else {
                const firstRegularSeason = allSeasonsSorted.find(s => s.season_number > 0);
                initialSeasonNumber = firstRegularSeason ? firstRegularSeason.season_number : allSeasonsSorted[0].season_number;
            }

            if (initialSeasonNumber !== null) {
                handleSelectSeason(initialSeasonNumber);
            }
        }
    }, [details, mediaType, activeSeasonTab, allSeasonsSorted, nextEpisodeToWatch, handleSelectSeason, activeTab]);

    const handleSaveShowComment = (text: string) => {
        onSaveComment(mediaKey, text);
    };

    const handleToggleEpisodeWrapper = useCallback((showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number) => {
        if (trackedItem) {
            onToggleEpisode(showId, seasonNumber, episodeNumber, currentStatus, trackedItem);
        } else {
            console.error("Cannot toggle episode: TrackedItem is not available. This might happen if details haven't loaded yet.");
        }
    }, [trackedItem, onToggleEpisode]);

    const handleSaveJournalEntry = (entry: JournalEntry | null, seasonNumber: number, episodeNumber: number) => {
      onSaveJournal(id, seasonNumber, episodeNumber, entry);
    };
    
    const handleStatusUpdate = (newStatus: WatchStatus | null) => {
        if (!trackedItem) return;
        
        if (newStatus === 'completed' && trackedItem.media_type === 'tv') {
            onMarkAllWatched(trackedItem.id, trackedItem);
        } else {
            onUpdateLists(trackedItem, currentList, newStatus);
        }
    };

    const handleOpenEpisodeDetail = (episode: Episode) => {
        setEpisodeDetailState({ isOpen: true, episode });
    };

    const handleCloseEpisodeDetail = () => {
        setEpisodeDetailState({ isOpen: false, episode: null });
    };
    
    const handleToggleEpisodeInModal = () => {
        const ep = episodeDetailState.episode;
        if (!ep) return;
        const seasonData = seasonDetailsCache[ep.season_number];
        if (!seasonData) return;
        
        const totalEpisodesInSeason = seasonData.episodes.length > 0 
            ? seasonData.episodes.length
            : details?.seasons?.find(s => s.season_number === ep.season_number)?.episode_count || 0;
            
        const isLastEpisode = ep.episode_number === totalEpisodesInSeason;
        
        if (!isLastEpisode) {
            handleToggleEpisodeWrapper(id, ep.season_number, ep.episode_number, watchProgress[id]?.[ep.season_number]?.[ep.episode_number]?.status || 0);
        } else {
            const progressForSeason = watchProgress[id]?.[ep.season_number] || {};
            let hasUnwatched = false;
            for (let i = 1; i < ep.episode_number; i++) {
                if (progressForSeason[i]?.status !== 2) {
                    hasUnwatched = true;
                    break;
                }
            }
            if (hasUnwatched && window.confirm("You've marked the last episode. Mark all previous unwatched episodes in this season as watched?")) {
                onMarkPreviousEpisodesWatched(id, ep.season_number, ep.episode_number);
            } else {
                handleToggleEpisodeWrapper(id, ep.season_number, ep.episode_number, watchProgress[id]?.[ep.season_number]?.[ep.episode_number]?.status || 0);
            }
        }
    };

    const handleNavigateEpisode = useCallback((direction: 'next' | 'previous') => {
        const { episode } = episodeDetailState;
        if (!episode) return;

        const seasonData = seasonDetailsCache[episode.season_number];
        if (!seasonData || !seasonData.episodes) return;

        const currentIndex = seasonData.episodes.findIndex(e => e.id === episode.id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (newIndex >= 0 && newIndex < seasonData.episodes.length) {
            const newEpisode = seasonData.episodes[newIndex];
            setEpisodeDetailState({ isOpen: true, episode: newEpisode });
        }
    }, [episodeDetailState, seasonDetailsCache]);
    
    const handleOpenJournalForMedia = useCallback(async () => {
        if (!details) return;
    
        if (mediaType === 'movie') {
            const dummyEpisodeForMedia: Episode = { id: 0, name: details.name, episode_number: 0, season_number: 0, overview: '', still_path: null, air_date: '' };
            setJournalState({ isOpen: true, season: 0, episode: dummyEpisodeForMedia });
        } else if (mediaType === 'tv') {
            let seasonToOpen: number | undefined;
            let episodeToOpen: Episode | undefined;
    
            if (nextEpisodeToWatch) {
                seasonToOpen = nextEpisodeToWatch.seasonNumber;
                let seasonData = seasonDetailsCache[nextEpisodeToWatch.seasonNumber];
                if (!seasonData) {
                    try {
                        seasonData = await getSeasonDetails(id, nextEpisodeToWatch.seasonNumber);
                        setSeasonDetailsCache(prev => ({ ...prev, [nextEpisodeToWatch.seasonNumber]: seasonData }));
                    } catch (e) { console.error("Failed to fetch season for journal", e); }
                }
                if(seasonData) {
                    episodeToOpen = seasonData.episodes.find(e => e.episode_number === nextEpisodeToWatch.episodeNumber);
                }
            }
            setJournalState({ isOpen: true, season: seasonToOpen, episode: episodeToOpen });
        }
    }, [details, mediaType, nextEpisodeToWatch, seasonDetailsCache, id]);

    const handleLiveWatch = async () => {
        if (!details) return;
        alert("Your Live Watch session has started! You can manage it from the tracker at the bottom of the screen or on your dashboard.");
        
        if (mediaType === 'movie') {
            const mediaInfo: LiveWatchMediaInfo = {
                id: details.id,
                media_type: 'movie',
                title: details.name || 'Movie',
                poster_path: details.poster_path,
                runtime: details.runtime || 90,
            };
            onStartLiveWatch(mediaInfo);
        } else {
            if (!nextEpisodeToWatch) {
                alert("You've watched all available episodes!");
                return;
            }
            setIsLiveWatchLoading(true);
            try {
                const seasonData = await getSeasonDetails(id, nextEpisodeToWatch.seasonNumber);
                const episodeData = seasonData.episodes.find(e => e.episode_number === nextEpisodeToWatch.episodeNumber);
                
                if (!episodeData) throw new Error("Episode data not found.");
                
                const mediaInfo: LiveWatchMediaInfo = {
                    id: details.id,
                    media_type: 'tv',
                    title: details.name || 'Show',
                    poster_path: details.poster_path,
                    runtime: details.episode_run_time?.[0] || 45,
                    seasonNumber: episodeData.season_number,
                    episodeNumber: episodeData.episode_number,
                    episodeTitle: episodeData.name,
                };
                onStartLiveWatch(mediaInfo);
            } catch (e) {
                console.error("Failed to start live watch:", e);
                alert("Could not load next episode details. Please try again.");
            } finally {
                setIsLiveWatchLoading(false);
            }
        }
    };
    
    const handleOpenJournalForEpisode = (season: number, episode: Episode) => {
        setJournalState({ isOpen: true, season, episode });
    };
    
    const handleOpenEpisodeRatingModal = (episode: Episode) => {
        setEpisodeRatingModalState({ isOpen: true, episode });
    };

    const handleRateEpisode = (rating: number) => {
        if (episodeRatingModalState.episode) {
            onRateEpisode(id, episodeRatingModalState.episode.season_number, episodeRatingModalState.episode.episode_number, rating);
        }
        setEpisodeRatingModalState({ isOpen: false, episode: null });
    };


    // --- RENDER LOGIC ---
    if (loading) return <ShowDetailSkeleton />;
    if (error) return <div className="text-center py-20"><p className="text-red-500">{error}</p><button onClick={onBack} className="mt-4 px-4 py-2 bg-bg-secondary rounded-lg">Back</button></div>;
    if (!details) return null;

    const backdropUrl = getImageUrl(customBackdrop || details.backdrop_path, 'w1280', 'backdrop');
    
    const renderActionButtons = () => (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <div className="col-span-2 sm:col-span-1"><StatusSelector currentStatus={currentList} onUpdateStatus={handleStatusUpdate} /></div>
            <ActionButton icon={<ListBulletIcon className="w-6 h-6"/>} label="Add to Watchlist" onClick={() => trackedItem && onOpenCustomListModal(trackedItem)} />
            <ActionButton icon={<HeartIcon className="w-6 h-6" filled={isShowFavorited} />} label={isShowFavorited ? 'Favorited' : 'Favorite'} onClick={() => trackedItem && onToggleFavoriteShow(trackedItem)} isActive={isShowFavorited} />
            <ActionButton icon={<StarIcon className="w-6 h-6" filled={userRating > 0} />} label={userRating > 0 ? `Rated ${userRating}/5` : 'Rate It'} onClick={() => setIsRatingModalOpen(true)} isActive={userRating > 0} />
            <ActionButton icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6"/>} label="Comments" onClick={() => setIsCommentModalOpen(true)} isActive={!!showComment}/>
            {mediaType === 'tv' && (
                <ActionButton
                    icon={<CheckCircleIcon className="w-6 h-6"/>}
                    label="Mark All Watched"
                    onClick={() => trackedItem && onMarkAllWatched(id, trackedItem)}
                    disabled={currentList === 'completed'}
                    isActive={currentList === 'completed'}
                />
            )}
            {mediaType === 'movie' && (
                 <ActionButton
                    icon={<CheckCircleIcon className="w-6 h-6"/>}
                    label="Mark Completed"
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={currentList === 'completed'}
                    isActive={currentList === 'completed'}
                />
            )}
            <ActionButton icon={<ClockIcon className="w-6 h-6"/>} label="History" onClick={() => setIsHistoryModalOpen(true)} />
            <ActionButton
                icon={isLiveWatchLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin"/> : <PlayCircleIcon className="w-6 h-6"/>}
                label={mediaType === 'tv' ? "Live Watch Next" : "Live Watch"}
                onClick={handleLiveWatch}
                disabled={isLiveWatchLoading || (mediaType === 'tv' && !nextEpisodeToWatch)}
            />
            <ActionButton icon={<BookOpenIcon className="w-6 h-6"/>} label="Journal" onClick={handleOpenJournalForMedia} />
        </div>
    );

    const renderHeader = () => {
        const runtime = details.episode_run_time?.[0] || details.runtime;
        return (
            <>
                <div className="relative mb-8">
                    {backdropUrl === PLACEHOLDER_BACKDROP_LARGE ? (
                        <div className="w-full h-60 sm:h-80 md:h-96" style={{ background: 'var(--card-gradient)' }} />
                    ) : (
                        <FallbackImage srcs={[backdropUrl]} placeholder={PLACEHOLDER_BACKDROP_LARGE} alt={`${details.name} backdrop`} className="w-full h-60 sm:h-80 md:h-96 object-cover"/>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent"></div>
                    <button onClick={onBack} className="fixed top-20 left-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-40"><ChevronLeftIcon className="h-6 w-6" /></button>
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                        <button onClick={() => fetchData(true)} className="p-2 bg-backdrop rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10" aria-label="Refresh data"><ArrowPathIcon className="h-6 w-6" /></button>
                        <button onClick={onBack} className="p-2 bg-backdrop rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10" aria-label="Close">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
                <div className="container mx-auto px-4 -mt-24 sm:-mt-32 relative z-10">
                    <div className="flex flex-col sm:flex-row items-start">
                        <div className="w-32 h-48 sm:w-48 sm:h-72 flex-shrink-0 border-4 border-bg-primary rounded-lg shadow-xl overflow-hidden">
                           <FallbackImage srcs={posterSrcs} placeholder={PLACEHOLDER_POSTER} alt={`${details.name} poster`} className="w-full h-full object-cover"/>
                        </div>
                        <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">{details.name}</h1>
                            <div className="flex items-center flex-wrap gap-x-2 text-sm text-text-secondary mt-1">
                                <span>{(details.first_air_date || details.release_date)?.substring(0, 4)}</span>
                                <span className="hidden sm:inline">&bull;</span>
                                <span>{details.genres?.map(g => g.name).join(', ')}</span>
                            </div>

                            <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                {displayStatus && displayStatus !== 'Unknown' && (
                                    <span className="bg-bg-secondary/80 text-text-secondary text-xs font-semibold px-3 py-1 rounded-full">
                                        Status: {displayStatus}
                                    </span>
                                )}
                                {isRecent.movie && (
                                    <span className="bg-sky-500/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        New Release
                                    </span>
                                )}
                                {runtime && (
                                    <span className="bg-bg-secondary/80 text-text-secondary text-xs font-semibold px-3 py-1 rounded-full">
                                        {details.media_type === 'tv' ? 'Approx. Episode Runtime' : 'Runtime'}: {formatRuntime(runtime)}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center space-x-4 mt-3">
                               <div className="flex items-center space-x-1"> <StarIcon filled className="w-5 h-5 text-yellow-400"/> <span className="font-semibold">{details.vote_average?.toFixed(1)}</span><span className="text-xs text-text-secondary">/10</span></div>
                            </div>
                        </div>
                    </div>
                    {renderActionButtons()}
                </div>
            </>
        );
    };

    const tvTabs: { id: ShowDetailTab, label: string }[] = [
        { id: 'seasonDescription', label: details.number_of_seasons === 1 ? 'Season & Description' : 'Seasons & Description' },
        { id: 'cast', label: 'Cast & Crew' },
        { id: 'moreInfo', label: 'More Info & Details' },
        { id: 'recommendations', label: 'You Might Also Like' },
        { id: 'watch', label: 'Where to Watch' },
        { id: 'customize', label: 'Customize' },
    ];
    if (isRecent.tv) {
        tvTabs.unshift({ id: 'recentlyAired', label: 'Recently Aired' });
    }

    const movieTabs: { id: ShowDetailTab, label: string }[] = [
        { id: 'overview', label: 'Overview & Details' },
        { id: 'cast', label: 'Cast & Crew' },
        { id: 'recommendations', label: 'You Might Also Like' },
        { id: 'watch', label: 'Where to Watch' },
        { id: 'customize', label: 'Customize' },
    ];

    const tabsToRender = mediaType === 'tv' ? tvTabs : movieTabs;
    
    const renderTabContent = () => {
        const handleMarkSeasonWatchedWrapper = (showId: number, seasonNumber: number) => {
            if (trackedItem) {
                onMarkSeasonWatched(showId, seasonNumber, trackedItem);
            }
        };

        switch (activeTab) {
            case 'recentlyAired': {
                const ep = details.last_episode_to_air;
                if (!ep) return <p className="text-text-secondary">Could not load recent episode details.</p>;
                return <NextUpWidget
                    showId={id}
                    details={details}
                    tvdbDetails={tvdbDetails}
                    nextEpisodeToWatch={{ seasonNumber: ep.season_number, episodeNumber: ep.episode_number }}
                    onOpenJournal={handleOpenJournalForEpisode}
                    onToggleEpisode={handleToggleEpisodeWrapper}
                    favoriteEpisodes={favoriteEpisodes}
                    onToggleFavoriteEpisode={onToggleFavoriteEpisode}
                    onStartLiveWatch={onStartLiveWatch}
                    watchProgress={watchProgress}
                    onSaveJournal={onSaveJournal}
                    onSaveComment={onSaveComment}
                    comments={comments}
                />;
            }
            case 'seasonDescription': // TV only
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">Show Description</h3>
                            <p className="text-text-secondary whitespace-pre-wrap">{details.overview || ''}</p>
                        </div>
                        {nextEpisodeToWatch && (
                            <NextUpWidget
                                showId={id}
                                details={details}
                                tvdbDetails={tvdbDetails}
                                nextEpisodeToWatch={nextEpisodeToWatch}
                                onToggleEpisode={handleToggleEpisodeWrapper}
                                onOpenJournal={handleOpenJournalForEpisode}
                                favoriteEpisodes={favoriteEpisodes}
                                onToggleFavoriteEpisode={onToggleFavoriteEpisode}
                                onStartLiveWatch={onStartLiveWatch}
                                watchProgress={watchProgress}
                                onSaveJournal={onSaveJournal}
                                onSaveComment={onSaveComment}
                                comments={comments}
                            />
                        )}
                        <div className="border-b border-bg-secondary/50"></div>
                        
                        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
                            {allSeasonsSorted.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSelectSeason(s.season_number)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                                    activeSeasonTab === s.season_number
                                        ? 'bg-accent-gradient text-on-accent'
                                        : 'bg-bg-secondary text-text-secondary hover:brightness-125'
                                    }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4">
                            {activeSeasonTab !== null && (() => {
                                const season = allSeasonsSorted.find(s => s.season_number === activeSeasonTab);
                                if (!season) return <p className="text-text-secondary">Select a season to view episodes.</p>;
                                
                                const seasonPosterSrcs = [
                                    season.poster_path,
                                    details.poster_path,
                                ].filter(Boolean).map(p => getImageUrl(p, 'w342'));
                                
                                const seasonPosterPath = season.poster_path || details.poster_path;

                                return (
                                     <>
                                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                                            <div className="w-32 flex-shrink-0">
                                                <button onClick={() => seasonPosterPath && setImageModalUrl(getImageUrl(seasonPosterPath, 'original'))} className="w-full">
                                                    <FallbackImage
                                                        srcs={seasonPosterSrcs}
                                                        placeholder={PLACEHOLDER_POSTER}
                                                        alt={season.name}
                                                        className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg transition-transform hover:scale-105"
                                                    />
                                                </button>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h4 className="font-bold text-text-primary mb-1">Season Description</h4>
                                                {season.overview ? (
                                                    <p className="text-text-secondary whitespace-pre-wrap">{season.overview}</p>
                                                ) : (
                                                    <p className="text-text-secondary italic">No description available for this season.</p>
                                                )}
                                                <div className="mt-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkSeasonWatchedWrapper(id, season.season_number);
                                                        }}
                                                        className="flex items-center justify-center space-x-2 px-4 py-2 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125"
                                                    >
                                                        <CheckCircleIcon className="h-5 w-5" />
                                                        <span>Mark Season Watched</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <SeasonAccordion
                                                key={season.id}
                                                season={season}
                                                showId={id}
                                                isExpanded={true}
                                                isCollapsible={false}
                                                onToggle={() => {}}
                                                seasonDetails={seasonDetailsCache[activeSeasonTab]}
                                                onOpenEpisodeDetail={handleOpenEpisodeDetail}
                                                onMarkSeasonWatched={handleMarkSeasonWatchedWrapper}
                                                onMarkPreviousEpisodesWatched={onMarkPreviousEpisodesWatched}
                                                watchProgress={watchProgress}
                                                onToggleEpisode={handleToggleEpisodeWrapper}
                                                onSaveJournal={onSaveJournal}
                                                favoriteEpisodes={favoriteEpisodes}
                                                onToggleFavoriteEpisode={onToggleFavoriteEpisode}
                                                onStartLiveWatch={onStartLiveWatch}
                                                onOpenJournal={handleOpenJournalForEpisode}
                                                showDetails={details}
                                                showPosterPath={details.poster_path}
                                                tvdbShowPosterPath={tvdbDetails?.image}
                                                episodeRatings={episodeRatings}
                                                onOpenEpisodeRatingModal={handleOpenEpisodeRatingModal}
                                                onAddWatchHistory={onAddWatchHistory}
                                                onSaveComment={onSaveComment}
                                                comments={comments}
                                            />
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                );
            case 'overview': // Movie only
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-text-primary mb-2">Overview</h2>
                        <p className="text-text-secondary whitespace-pre-wrap">{details.overview || ''}</p>
                        {collectionDetails && <MovieCollection collectionId={collectionDetails.id} currentMovieId={id} onSelectMovie={onSelectShow} />}
                        <div className="border-t border-bg-secondary/50 pt-6 mt-6">
                            <h2 className="text-xl font-bold text-text-primary mb-4">Details</h2>
                            <MoreInfo details={details} />
                        </div>
                    </div>
                );
            case 'cast': // Both TV and Movie
                 return <CastAndCrew details={details} tvdbDetails={tvdbDetails} onSelectPerson={onSelectPerson} />;
            case 'moreInfo': // TV only now
                return <MoreInfo details={details} />;
            case 'recommendations':
                return <RecommendedMedia recommendations={details.recommendations?.results || []} onSelectShow={onSelectShow} />;
            case 'watch':
                return <WhereToWatch providers={providers} />;
            case 'customize':
                return <CustomizeTab posterUrl={posterSrcs[0] || PLACEHOLDER_POSTER} backdropUrl={backdropUrl} onOpenImageSelector={() => setIsImageSelectorOpen(true)} />;
            default:
                return null;
        }
    };
    
    const episodeRating = episodeDetailState.episode ? (episodeRatings[id]?.[episodeDetailState.episode.season_number]?.[episodeDetailState.episode.episode_number] || 0) : 0;

    return (
        <>
            {imageModalUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setImageModalUrl(null)}>
                    <img src={imageModalUrl} alt="Poster" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
                    <button onClick={() => setImageModalUrl(null)} className="absolute top-4 right-4 p-2 bg-backdrop rounded-full text-text-primary"><XMarkIcon className="h-6 w-6" /></button>
                </div>
            )}
            <HistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                history={historyForMedia}
                mediaTitle={details.name || ''}
                onDeleteHistoryItem={onDeleteHistoryItem}
                onClearMediaHistory={onClearMediaHistory}
                mediaDetails={details}
            />
            <JournalModal
                isOpen={journalState.isOpen}
                onClose={() => setJournalState({ isOpen: false })}
                onSave={handleSaveJournalEntry}
                mediaDetails={details}
                initialSeason={journalState.season}
                initialEpisode={journalState.episode}
                watchProgress={watchProgress}
            />
            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                onSave={handleSaveShowComment}
                mediaTitle={details.name || ''}
                initialText={showComment?.text}
            />
            <ImageSelectorModal isOpen={isImageSelectorOpen} onClose={() => setIsImageSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => onSetCustomImage(id, type, path)} />
            <RatingModal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} onSave={(r) => onRateItem(id, r)} currentRating={userRating} mediaTitle={details.name || ''} />
            {episodeRatingModalState.isOpen && episodeRatingModalState.episode && (
                <RatingModal
                    isOpen={episodeRatingModalState.isOpen}
                    onClose={() => setEpisodeRatingModalState({ isOpen: false, episode: null })}
                    onSave={handleRateEpisode}
                    currentRating={episodeRatings[id]?.[episodeRatingModalState.episode.season_number]?.[episodeRatingModalState.episode.episode_number] || 0}
                    mediaTitle={`S${episodeRatingModalState.episode.season_number} E${episodeRatingModalState.episode.episode_number}: ${episodeRatingModalState.episode.name}`}
                />
            )}
            {details.media_type === 'tv' && episodeDetailState.episode && seasonDetailsCache[episodeDetailState.episode.season_number] && (
                <EpisodeDetailModal 
                    isOpen={episodeDetailState.isOpen}
                    onClose={handleCloseEpisodeDetail}
                    episode={episodeDetailState.episode}
                    showDetails={details}
                    seasonDetails={seasonDetailsCache[episodeDetailState.episode.season_number]}
                    tvdbShowPosterPath={tvdbDetails?.image}
                    isWatched={watchProgress[id]?.[episodeDetailState.episode.season_number]?.[episodeDetailState.episode.episode_number]?.status === 2}
                    onToggleWatched={handleToggleEpisodeInModal}
                    onOpenJournal={() => setJournalState({ isOpen: true, season: episodeDetailState.episode!.season_number, episode: episodeDetailState.episode! })}
                    isFavorited={!!favoriteEpisodes[id]?.[episodeDetailState.episode.season_number]?.[episodeDetailState.episode.episode_number]}
                    onToggleFavorite={() => onToggleFavoriteEpisode(id, episodeDetailState.episode!.season_number, episodeDetailState.episode!.episode_number)}
                    onStartLiveWatch={onStartLiveWatch}
                    onSaveJournal={onSaveJournal}
                    watchProgress={watchProgress}
                    onNext={() => handleNavigateEpisode('next')}
                    onPrevious={() => handleNavigateEpisode('previous')}
                    onAddWatchHistory={onAddWatchHistory}
                    onRate={() => handleOpenEpisodeRatingModal(episodeDetailState.episode!)}
                    episodeRating={episodeRating}
                    onSaveComment={onSaveComment}
                    comments={comments}
                />
            )}
            
            {renderHeader()}
            <div className="container mx-auto px-4 mt-8">
                <div className="border-b border-bg-secondary/50 mb-6">
                    <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-2">
                        {tabsToRender.map(tab => (
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
            </div>
        </>
    );
};

export default ShowDetail;
