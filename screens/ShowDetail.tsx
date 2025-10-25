import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, clearMediaCache } from '../services/tmdbService';
import { getTvdbShowExtended } from '../services/tvdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, TvdbShow, WatchProviderResponse } from '../types';
import { ChevronLeftIcon, BookOpenIcon, PlusIcon, StarIcon, ArrowPathIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from '../components/FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP_LARGE } from '../constants';
import SeasonAccordion from '../components/SeasonAccordion';
import JournalModal from '../components/JournalModal';
import WatchlistModal from '../components/WatchlistModal';
import ImageSelectorModal from '../components/ImageSelectorModal';
import CastAndCrew from '../components/CastAndCrew';
import MoreInfo from '../components/MoreInfo';
import RecommendedMedia from '../components/RecommendedMedia';
import CustomizeTab from '../components/CustomizeTab';
import WhereToWatch from '../components/WhereToWatch';

// --- PROPS INTERFACE ---
interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  onBack: () => void;
  watchProgress: WatchProgress;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry) => void;
  trackedLists: { watching: TrackedItem[], planToWatch: TrackedItem[], completed: TrackedItem[] };
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  customImagePaths: CustomImagePaths;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  favorites: TrackedItem[];
  onToggleFavoriteShow: (item: TrackedItem) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

type ShowDetailTab = 'episodes' | 'cast' | 'recommendations' | 'watch' | 'info' | 'customize';

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

// --- VALIDATION FUNCTION ---
const validateMediaDetails = (data: Partial<TmdbMediaDetails>): TmdbMediaDetails => {
    const title = data.title || data.name || "Untitled";
    return {
        id: data.id || 0,
        media_type: data.media_type || 'movie',
        title: title,
        name: title,
        poster_path: data.poster_path || null,
        backdrop_path: data.backdrop_path || null,
        overview: data.overview || "No description available.",
        genres: Array.isArray(data.genres) ? data.genres : [],
        seasons: Array.isArray(data.seasons) ? data.seasons.filter(s => s.season_number > 0) : [], // Filter out "Specials"
        vote_average: typeof data.vote_average === 'number' ? data.vote_average : 0,
        vote_count: typeof data.vote_count === 'number' ? data.vote_count : 0,
        credits: data.credits || { cast: [], crew: [] },
        recommendations: data.recommendations || { results: [] },
        videos: data.videos || { results: [] },
        images: data.images || { posters: [], backdrops: [] },
        ...data
    };
};

// --- MAIN COMPONENT ---
const ShowDetail: React.FC<ShowDetailProps> = (props) => {
    const { id, mediaType, onBack, watchProgress, onToggleEpisode, onSaveJournal, trackedLists, onUpdateLists, customImagePaths, onSetCustomImage, favorites, onToggleFavoriteShow, onSelectShow } = props;

    // --- STATE MANAGEMENT ---
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [tvdbDetails, setTvdbDetails] = useState<TvdbShow | null>(null);
    const [providers, setProviders] = useState<WatchProviderResponse | null>(null);
    const [seasonDetailsCache, setSeasonDetailsCache] = useState<Record<number, TmdbSeasonDetails>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
    const [journalState, setJournalState] = useState<{ isOpen: boolean; season?: number; episode?: Episode }>({ isOpen: false });
    const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
    const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

    const defaultTab = mediaType === 'tv' ? 'episodes' : 'cast';
    const [activeTab, setActiveTab] = useState<ShowDetailTab>(defaultTab);

    // --- DATA FETCHING ---
    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        if(forceRefresh) {
            clearMediaCache(id, mediaType);
        }
        try {
            const [tmdbData, providerData] = await Promise.all([
                getMediaDetails(id, mediaType),
                getWatchProviders(id, mediaType).catch(() => null)
            ]);
            
            const validatedData = validateMediaDetails(tmdbData);
            setDetails(validatedData);
            setProviders(providerData);

            if (mediaType === 'tv' && validatedData.external_ids?.tvdb_id) {
                getTvdbShowExtended(validatedData.external_ids.tvdb_id)
                    .then(setTvdbDetails)
                    .catch(e => console.warn("Could not fetch TVDB details:", e));
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
    }, [fetchData]);

    const handleToggleSeason = async (seasonNumber: number) => {
        const newExpandedSeason = expandedSeason === seasonNumber ? null : seasonNumber;
        setExpandedSeason(newExpandedSeason);

        if (newExpandedSeason !== null && !seasonDetailsCache[newExpandedSeason]) {
            try {
                const seasonData = await getSeasonDetails(id, newExpandedSeason);
                setSeasonDetailsCache(prev => ({ ...prev, [newExpandedSeason]: seasonData }));
            } catch (e) {
                console.error("Failed to load season details", e);
            }
        }
    };

    // --- MEMOIZED VALUES ---
    const customPoster = customImagePaths[id]?.poster_path;
    const customBackdrop = customImagePaths[id]?.backdrop_path;
    const isFavorite = useMemo(() => favorites.some(fav => fav.id === id), [favorites, id]);
    
    const currentList = useMemo((): WatchStatus | null => {
        if (trackedLists.watching.some(i => i.id === id)) return 'watching';
        if (trackedLists.planToWatch.some(i => i.id === id)) return 'planToWatch';
        if (trackedLists.completed.some(i => i.id === id)) return 'completed';
        return null;
    }, [trackedLists, id]);
    
    const trackedItem: TrackedItem | null = useMemo(() => {
        if (!details) return null;
        return {
            id: details.id,
            title: details.title || details.name || 'Untitled',
            media_type: details.media_type,
            poster_path: details.poster_path,
            genre_ids: details.genres.map(g => g.id),
        }
    }, [details]);
    
    // --- EVENT HANDLERS ---
    const handleOpenJournal = (season: number, episode: Episode) => {
        setJournalState({ isOpen: true, season, episode });
    };
    
    const handleSaveJournalEntry = (entry: JournalEntry) => {
        if (journalState.season && journalState.episode) {
            onSaveJournal(id, journalState.season, journalState.episode.episode_number, entry);
        }
    };

    const handleUpdateList = (newList: WatchStatus | null) => {
        if (trackedItem) {
            onUpdateLists(trackedItem, currentList, newList);
        }
        setIsWatchlistModalOpen(false);
    };

    // --- RENDER LOGIC ---
    if (loading) return <ShowDetailSkeleton />;
    if (error) return (
        <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <button onClick={onBack} className="mt-4 px-4 py-2 bg-bg-secondary rounded-lg">Back</button>
        </div>
    );
    if (!details) return null;

    const posterUrl = getImageUrl(customPoster || details.poster_path, 'w500');
    const backdropUrl = getImageUrl(customBackdrop || details.backdrop_path, 'w1280', 'backdrop');

    const tabs: { id: ShowDetailTab, label: string }[] = [
        ...(mediaType === 'tv' ? [{ id: 'episodes' as const, label: 'Episodes' }] : []),
        { id: 'cast', label: 'Cast & Crew' },
        { id: 'recommendations', label: 'You Might Also Like' },
        { id: 'watch', label: 'Where to Watch' },
        { id: 'info', label: 'More Info' },
        { id: 'customize', label: 'Customize' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'episodes':
                return (
                    <div className="space-y-2">
                        {(details.seasons || []).map(s => (
                            <SeasonAccordion
                                key={s.id}
                                season={s}
                                showId={id}
                                isExpanded={expandedSeason === s.season_number}
                                onToggle={() => handleToggleSeason(s.season_number)}
                                seasonDetails={seasonDetailsCache[s.season_number]}
                                watchProgress={watchProgress}
                                onToggleEpisode={onToggleEpisode}
                                onOpenJournal={handleOpenJournal}
                                showPosterPath={details.poster_path}
                                tvdbShowPosterPath={tvdbDetails?.image}
                            />
                        ))}
                    </div>
                );
            case 'cast': return <CastAndCrew details={details} />;
            case 'recommendations': return <RecommendedMedia recommendations={details.recommendations?.results || []} onSelectShow={onSelectShow} />;
            case 'watch': return <WhereToWatch providers={providers} />;
            case 'info': return <MoreInfo details={details} />;
            case 'customize': return <CustomizeTab posterUrl={posterUrl} backdropUrl={backdropUrl} onOpenImageSelector={() => setIsImageSelectorOpen(true)} />;
            default: return null;
        }
    };
    
    return (
        <div className="animate-fade-in">
            {/* --- Modals --- */}
            <JournalModal
                isOpen={journalState.isOpen}
                onClose={() => setJournalState({ isOpen: false })}
                onSave={handleSaveJournalEntry}
                existingEntry={watchProgress[id]?.[journalState.season!]?.[journalState.episode?.episode_number!]?.journal || null}
                episodeName={`S${journalState.season} E${journalState.episode?.episode_number}: ${journalState.episode?.name}`}
            />
            <WatchlistModal isOpen={isWatchlistModalOpen} onClose={() => setIsWatchlistModalOpen(false)} onUpdateList={handleUpdateList} currentList={currentList}/>
            <ImageSelectorModal
                isOpen={isImageSelectorOpen}
                onClose={() => setIsImageSelectorOpen(false)}
                posters={details.images?.posters || []}
                backdrops={details.images?.backdrops || []}
                onSelect={(type, path) => onSetCustomImage(id, type, path)}
            />

            {/* --- Header Banner --- */}
            <div className="relative mb-8">
                <FallbackImage
                    srcs={[backdropUrl]}
                    placeholder={PLACEHOLDER_BACKDROP_LARGE}
                    alt={`${details.name} backdrop`}
                    className="w-full h-60 sm:h-80 md:h-96 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent"></div>
                <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-backdrop rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                 <button onClick={() => fetchData(true)} className="absolute top-4 right-4 p-2 bg-backdrop rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10" aria-label="Refresh data">
                    <ArrowPathIcon className="h-6 w-6" />
                </button>
            </div>
            
            <div className="container mx-auto px-4 -mt-24 sm:-mt-32 relative z-10">
                <div className="flex flex-col sm:flex-row items-end">
                    <FallbackImage
                        srcs={[posterUrl]}
                        placeholder={PLACEHOLDER_POSTER}
                        alt={`${details.name} poster`}
                        className="w-32 h-48 sm:w-48 sm:h-72 object-cover rounded-lg shadow-xl flex-shrink-0 border-4 border-bg-primary"
                    />
                    <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">{details.name}</h1>
                        <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                            <span>{details.media_type === 'tv' ? details.first_air_date?.substring(0, 4) : details.release_date?.substring(0, 4)}</span>
                            <span>{details.genres?.[0]?.name}</span>
                            {details.media_type === 'tv' && <span>{details.number_of_seasons} Season(s)</span>}
                        </div>
                         <p className="mt-2 text-sm text-text-secondary line-clamp-3 sm:line-clamp-2">{details.overview}</p>
                    </div>
                </div>

                <div className="mt-6 flex items-center space-x-2">
                    <button 
                        onClick={() => setIsWatchlistModalOpen(true)}
                        className="flex-grow flex items-center justify-center py-2.5 px-4 rounded-md bg-accent-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        <span>{currentList ? currentList.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : 'Add to List'}</span>
                    </button>
                    <button
                        onClick={() => trackedItem && onToggleFavoriteShow(trackedItem)}
                        className={`p-2.5 rounded-md transition-colors ${isFavorite ? 'bg-yellow-500/20 text-yellow-400' : 'bg-bg-secondary text-text-secondary hover:text-yellow-400'}`}
                        aria-label="Toggle Favorite"
                    >
                       <StarIcon filled={isFavorite} className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            {/* --- Tabs and Content --- */}
            <div className="container mx-auto px-4 mt-8">
                <div className="border-b border-bg-secondary mb-6">
                    <div className="flex space-x-2 overflow-x-auto hide-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                    activeTab === tab.id
                                    ? 'border-primary-accent text-text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ShowDetail;