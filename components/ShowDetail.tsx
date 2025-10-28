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
const ShowDetail: React.FC<ShowDetailProps>