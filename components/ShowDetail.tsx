import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, clearMediaCache, getCollectionDetails } from '../services/tmdbService';
import { getTvdbShowExtended } from '../services/tvdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, TvdbShow, WatchProviderResponse, TmdbCollection, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo } from '../types';
import { ChevronLeftIcon, BookOpenIcon, PlusIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, PlayCircleIcon, HeartIcon, QuestionMarkCircleIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP_LARGE } from '../constants';
import SeasonAccordion from './SeasonAccordion';
import JournalModal from './JournalModal';
import WatchlistModal from './WatchlistModal';
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
import MoodSelectorModal from './MoodSelectorModal';
import { formatRuntime } from '../utils/formatUtils';

// --- PROPS INTERFACE ---
interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  onBack: () => void;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  trackedLists: { watching: TrackedItem[], planToWatch: TrackedItem[], completed: TrackedItem[] };
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  customImagePaths: CustomImagePaths;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  favorites: TrackedItem[];
  onToggleFavoriteShow: (item: TrackedItem) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  customLists: CustomList[];
  onUpdateCustomList: (listId: string, item: TrackedItem, action: 'add' | 'remove') => void;
  ratings: UserRatings;
  onRateItem: (mediaId: number, rating: number) => void;
  onMarkAllWatched: (showId: number) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onSelectPerson: (personId: number) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
}

type ShowDetailTab = 'seasonDescription' | 'overview' | 'cast' | 'moreInfo' | 'recommendations' | 'watch' | 'customize';

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

const ExpandableText: React.FC<{ text: string, maxLength?: number }> = ({ text, maxLength = 250 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return null;

    if (text.length <= maxLength) {
        return <p className="text-text-secondary">{text}</p>;
    }

    return (
        <div>
            <p className="text-text-secondary">
                {isExpanded ? text : `${text.substring(0, maxLength)}...`}
            </p>
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm font-semibold text-primary-accent hover:underline mt-1">
                {isExpanded ? 'Read Less' : 'Read More'}
            </button>
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
        seasons: (Array.isArray(safeData.seasons) ? safeData.seasons : []).filter(s => s && s.season_number > 0 && (!s.air_date || s.air_date <= today)),
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
    const { id, mediaType, onBack, watchProgress, history, onToggleEpisode, onSaveJournal, trackedLists, onUpdateLists, customImagePaths, onSetCustomImage, favorites, onToggleFavoriteShow, onSelectShow, customLists, onUpdateCustomList, ratings, onRateItem, onMarkAllWatched, favoriteEpisodes, onToggleFavoriteEpisode, onSelectPerson, onStartLiveWatch } = props;

    // --- STATE MANAGEMENT ---
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [tvdbDetails, setTvdbDetails] = useState<TvdbShow | null>(null);
    const [providers, setProviders] = useState<WatchProviderResponse | null>(null);
    const [seasonDetailsCache, setSeasonDetailsCache] = useState<Record<number, TmdbSeasonDetails>>({});
    const [collectionDetails, setCollectionDetails] = useState<TmdbCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [journalState, setJournalState] = useState<{ isOpen: boolean; season?: number; episode?: Episode }>({ isOpen: false });
    const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
    const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
    const [episodeDetailState, setEpisodeDetailState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });
    const [isLiveWatchLoading, setIsLiveWatchLoading] = useState(false);

    const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
    
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
                if (nextAirDate > now - 7 * 24 * 60 * 60 * 1000 && nextAirDate < now + 270 * 24 * 60 * 60 * 1000) {
                    return 'In Season';
                }
            }
            
            if (last_episode_to_air?.air_date) {
                const lastAirDate = new Date(last_episode_to_air.air_date).getTime();
                if (now - lastAirDate < 120 * 24 * 60 * 60 * 1000) {
                    return 'In Season';
                }
            }
            return 'Off Season';
        }

        return status || 'Unknown';
    }, [details]);
    
    const customPoster = customImagePaths[id]?.poster_path;
    const customBackdrop = customImagePaths[id]?.backdrop_path;
    
    const currentList = useMemo((): WatchStatus | null => {
        if (trackedLists.watching.some(i => i.id === id)) return 'watching';
        if (trackedLists.planToWatch.some(i => i.id === id)) return 'planToWatch';
        if (trackedLists.completed.some(i => i.id === id)) return 'completed';
        return null;
    }, [trackedLists, id]);
    
    const trackedItem: TrackedItem | null = useMemo(() => {
        if (!details) return null;
        return { id: details.id, title: details.title || details.name || 'Untitled', media_type: details.media_type, poster_path: details.poster_path, genre_ids: details.genres.map(g => g.id) }
    }, [details]);

    const isShowFavorited = useMemo(() => favorites.some(i => i.id === id), [favorites, id]);
    const userRating = useMemo(() => ratings[id] || 0, [ratings, id]);
    
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
    
    const currentMood = useMemo(() => {
        if (mediaType === 'movie') {
            return watchProgress[id]?.[0]?.[0]?.journal?.mood;
        }
        return undefined; // Mood for TV shows is per-episode
    }, [watchProgress, id, mediaType]);

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

    // --- EVENT HANDLERS ---
    const handleToggleSeason = (seasonNumber: number) => {
        if (expandedSeason === seasonNumber) {
            setExpandedSeason(null);
        } else {
            setExpandedSeason(seasonNumber);
            if (!seasonDetailsCache[seasonNumber]) {
                getSeasonDetails(id, seasonNumber)
                    .then(data => {
                        setSeasonDetailsCache(prev => ({...prev, [seasonNumber]: data}));
                    })
                    .catch(e => console.error("Failed to fetch season details for accordion", e));
            }
        }
    };
    
    const handleSaveJournalEntry = (entry: JournalEntry) => {
        if (journalState.season !== undefined && journalState.episode) {
            onSaveJournal(id, journalState.season, journalState.episode.episode_number, entry);
        }
    };

    const handleUpdateList = (newListId: string | null) => {
        if (trackedItem) {
            const mainLists: (WatchStatus | null)[] = ['watching', 'planToWatch', 'completed', null];
            if (mainLists.includes(newListId as (WatchStatus | null))) {
                onUpdateLists(trackedItem, currentList, newListId as WatchStatus | null);
            } else if (newListId) {
                onUpdateCustomList(newListId, trackedItem, 'add');
            }
        }
        setIsWatchlistModalOpen(false);
    };

    const handleMarkWatched = () => {
        if(!trackedItem) return;
        if (mediaType === 'tv') {
            onMarkAllWatched(id);
        } else {
            onUpdateLists(trackedItem, currentList, 'completed');
        }
    };

    const handleOpenEpisodeDetail = (episode: Episode) => {
        setEpisodeDetailState({ isOpen: true, episode });
    };

    const handleCloseEpisodeDetail = () => {
        setEpisodeDetailState({ isOpen: false, episode: null });
    };
    
    const handleOpenJournalForMedia = () => {
        const dummyEpisodeForMedia = { 
            id: 0, 
            name: details?.name || "General Journal", 
            episode_number: mediaType === 'movie' ? 0 : -1, // Use -1 for generic TV journal
            season_number: 0, 
            overview: '', still_path: null, air_date: '' 
        };
        setJournalState({ isOpen: true, season: 0, episode: dummyEpisodeForMedia });
    };

    const handleSaveMood = (mood: string) => {
        if (mediaType !== 'movie') return;
        const existingJournal = watchProgress[id]?.[0]?.[0]?.journal;
        const newEntry: JournalEntry = {
            text: existingJournal?.text || '',
            mood: mood,
            timestamp: new Date().toISOString()
        };
        onSaveJournal(id, 0, 0, newEntry);
        setIsMoodModalOpen(false);
    };

    const handleLiveWatch = async () => {
        if (!details) return;
        
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

    // --- RENDER LOGIC ---
    if (loading) return <ShowDetailSkeleton />;
    if (error) return <div className="text-center py-20"><p className="text-red-500">{error}</p><button onClick={onBack} className="mt-4 px-4 py-2 bg-bg-secondary rounded-lg">Back</button></div>;
    if (!details) return null;

    const backdropUrl = getImageUrl(customBackdrop || details.backdrop_path, 'w1280', 'backdrop');
    
    const renderActionButtons = () => (
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <ActionButton icon={<PlusIcon className="w-6 h-6"/>} label="Add to List" onClick={() => setIsWatchlistModalOpen(true)} />
            <ActionButton icon={<HeartIcon className="w-6 h-6" filled={isShowFavorited} />} label={isShowFavorited ? 'Favorited' : 'Favorite'} onClick={() => trackedItem && onToggleFavoriteShow(trackedItem)} isActive={isShowFavorited} />
            <ActionButton icon={<StarIcon className="w-6 h-6" filled={userRating > 0} />} label={userRating > 0 ? `Rated ${userRating}/5` : 'Rate It'} onClick={() => setIsRatingModalOpen(true)} isActive={userRating > 0} />
            {mediaType === 'movie' && (
                <ActionButton 
                    icon={<span className="text-2xl h-6 w-6 flex items-center justify-center">{currentMood || '😶'}</span>} 
                    label="Mood" 
                    onClick={() => setIsMoodModalOpen(true)}
                    isActive={!!currentMood}
                />
            )}
            <ActionButton icon={<CheckCircleIcon className="w-6 h-6"/>} label={mediaType === 'tv' ? "Mark All" : "Watched"} onClick={handleMarkWatched} />
            <ActionButton
                icon={isLiveWatchLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin"/> : <PlayCircleIcon className="w-6 h-6"/>}
                label={mediaType === 'tv' ? "Live Watch Next" : "Live Watch"}
                onClick={handleLiveWatch}
                disabled={isLiveWatchLoading || (mediaType === 'tv' && !nextEpisodeToWatch)}
            />
            <ActionButton icon={<BookOpenIcon className="w-6 h-6"/>} label="Journal" onClick={handleOpenJournalForMedia} />
            <ActionButton icon={<QuestionMarkCircleIcon className="w-6 h-6" />} label="Report Issue" onClick={() => {}} />
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
                    <button onClick={() => fetchData(true)} className="absolute top-4 right-4 p-2 bg-backdrop rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10" aria-label="Refresh data"><ArrowPathIcon className="h-6 w-6" /></button>
                </div>
                <div className="container mx-auto px-4 -mt-24 sm:-mt-32 relative z-10">
                    <div className="flex flex-col sm:flex-row items-start">
                        <FallbackImage srcs={posterSrcs} placeholder={PLACEHOLDER_POSTER} alt={`${details.name} poster`} className="w-32 h-48 sm:w-48 sm:h-72 object-cover rounded-lg shadow-xl flex-shrink-0 border-4 border-bg-primary"/>
                        <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">{details.name}</h1>
                            <div className="flex items-center flex-wrap gap-x-2 text-sm text-text-secondary mt-1">
                                <span>{(details.first_air_date || details.release_date)?.substring(0, 4)}</span>
                                <span className="hidden sm:inline">&bull;</span>
                                <span>{details.genres?.map(g => g.name).join(', ')}</span>
                            </div>

                            <div className="mt-2 flex flex-col items-start gap-2">
                                {displayStatus && displayStatus !== 'Unknown' && (
                                    <span className="bg-bg-secondary/80 text-text-secondary text-xs font-semibold px-3 py-1 rounded-full">
                                        Status: {displayStatus}
                                    </span>
                                )}
                                {runtime && (
                                    <span className="bg-bg-secondary/80 text-text-secondary text-xs font-semibold px-3 py-1 rounded-full">
                                        Runtime: {formatRuntime(runtime)}
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

    const movieTabs: { id: ShowDetailTab, label: string }[] = [
        { id: 'overview', label: 'Overview & Details' },
        { id: 'cast', label: 'Cast & Crew' },
        { id: 'recommendations', label: 'You Might Also Like' },
        { id: 'watch', label: 'Where to Watch' },
        { id: 'customize', label: 'Customize' },
    ];

    const tabsToRender = mediaType === 'tv' ? tvTabs : movieTabs;
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'seasonDescription': // TV only
                return (
                    <div className="space-y-6">
                        <ExpandableText text={details.overview || ''} />
                        <div className="border-b border-bg-secondary/50"></div>
                        <h2 className="text-xl font-bold mt-6 mb-2">Seasons</h2>
                        <div className="space-y-2">
                            {(details.seasons || []).map(s => (
                                <SeasonAccordion
                                    key={s.id}
                                    season={s}
                                    showId={id}
                                    isExpanded={expandedSeason === s.season_number}
                                    onToggle={() => handleToggleSeason(s.season_number)}
                                    seasonDetails={seasonDetailsCache[s.season_number]}
                                    onOpenEpisodeDetail={handleOpenEpisodeDetail}
                                    {...props}
                                    showDetails={details}
                                    showPosterPath={details.poster_path}
                                    tvdbShowPosterPath={tvdbDetails?.image}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'overview': // Movie only
                return (
                    <div className="space-y-6">
                        <ExpandableText text={details.overview || ''} />
                        {collectionDetails && <MovieCollection collectionId={collectionDetails.id} currentMovieId={id} onSelectMovie={onSelectShow} />}
                        <div className="border-t border-bg-secondary/50 pt-6 mt-6">
                            <h2 className="text-xl font-bold text-text-primary mb-4">Details</h2>
                            <MoreInfo details={details} />
                        </div>
                    </div>
                );
            case 'cast': // Both TV and Movie
                 return <CastAndCrew details={details} onSelectPerson={onSelectPerson} />;
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

    return (
        <>
            <JournalModal isOpen={journalState.isOpen} onClose={() => setJournalState({ isOpen: false })} onSave={handleSaveJournalEntry} existingEntry={watchProgress[id]?.[journalState.season!]?.[journalState.episode?.episode_number!]?.journal || null} episodeName={journalState.episode?.name || ''} />
            <WatchlistModal isOpen={isWatchlistModalOpen} onClose={() => setIsWatchlistModalOpen(false)} onUpdateList={handleUpdateList} currentList={currentList} customLists={customLists}/>
            <ImageSelectorModal isOpen={isImageSelectorOpen} onClose={() => setIsImageSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => onSetCustomImage(id, type, path)} />
            <RatingModal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} onSave={(r) => onRateItem(id, r)} currentRating={userRating} mediaTitle={details.name || ''} />
            {mediaType === 'movie' && (
                <MoodSelectorModal isOpen={isMoodModalOpen} onClose={() => setIsMoodModalOpen(false)} onSelectMood={handleSaveMood} currentMood={currentMood} />
            )}
            {details.media_type === 'tv' && episodeDetailState.episode && seasonDetailsCache[episodeDetailState.episode.season_number] && (
                <EpisodeDetailModal 
                    isOpen={episodeDetailState.isOpen}
                    onClose={handleCloseEpisodeDetail}
                    episode={episodeDetailState.episode}
                    showDetails={details}
                    seasonDetails={seasonDetailsCache[episodeDetailState.episode.season_number]}
                    isWatched={watchProgress[id]?.[episodeDetailState.episode.season_number]?.[episodeDetailState.episode.episode_number]?.status === 2}
                    onToggleWatched={() => onToggleEpisode(id, episodeDetailState.episode!.season_number, episodeDetailState.episode!.episode_number, watchProgress[id]?.[episodeDetailState.episode!.season_number]?.[episodeDetailState.episode!.episode_number]?.status || 0)}
                    onOpenJournal={() => setJournalState({ isOpen: true, season: episodeDetailState.episode!.season_number, episode: episodeDetailState.episode! })}
                    isFavorited={!!favoriteEpisodes[id]?.[episodeDetailState.episode.season_number]?.[episodeDetailState.episode.episode_number]}
                    onToggleFavorite={() => onToggleFavoriteEpisode(id, episodeDetailState.episode!.season_number, episodeDetailState.episode!.episode_number)}
                    onStartLiveWatch={onStartLiveWatch}
                    onSaveJournal={onSaveJournal}
                    watchProgress={watchProgress}
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