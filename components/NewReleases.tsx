import React, { useState, useEffect } from 'react';
import { getNewReleases } from '../services/tmdbService';
import { TmdbMedia, TrackedItem } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, HeartIcon, ChevronRightIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_BACKDROP } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import { formatDate, isNewRelease } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import Carousel from './Carousel';

// Helper function for image URLs
const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

// Card component defined inside to keep it self-contained
const NewReleaseCard: React.FC<{
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onAdd: (item: TmdbMedia) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    isFavorite: boolean;
    isCompleted: boolean;
    timezone: string;
}> = ({ item, onSelect, onAdd, onMarkShowAsWatched, onToggleFavoriteShow, isFavorite, isCompleted, timezone }) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    
    const backdropSrcs = [
        getFullImageUrl(item.backdrop_path, 'w500'),
        getFullImageUrl(item.poster_path, 'w342'),
    ];

    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date;
    const isNew = isNewRelease(releaseDate);

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAdd(item);
    };

    const handleMarkWatchedClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkShowAsWatched(item);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const trackedItem: TrackedItem = {
            id: item.id,
            title: item.title || item.name || 'Untitled',
            media_type: item.media_type,
            poster_path: item.poster_path,
            genre_ids: item.genre_ids,
        };
        onToggleFavoriteShow(trackedItem);
    };

    const handleCalendarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMarkAsWatchedModalState({ isOpen: true, item: item });
    };

    const handleSaveWatchedDate = (data: { date: string; note: string }) => {
        if (markAsWatchedModalState.item) {
            onMarkShowAsWatched(markAsWatchedModalState.item, data.date);
        }
        setMarkAsWatchedModalState({ isOpen: false, item: null });
    };

    return (
        <>
            <MarkAsWatchedModal
                isOpen={markAsWatchedModalState.isOpen}
                onClose={() => setMarkAsWatchedModalState({ isOpen: false, item: null })}
                mediaTitle={markAsWatchedModalState.item?.title || markAsWatchedModalState.item?.name || ''}
                onSave={handleSaveWatchedDate}
            />
            <div className="w-72 flex-shrink-0">
                <div 
                    className="relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
                    onClick={() => onSelect(item.id, item.media_type)}
                >
                    {isNew && <NewReleaseOverlay />}
                    <div className="aspect-video">
                        <FallbackImage 
                            srcs={backdropSrcs}
                            placeholder={PLACEHOLDER_BACKDROP}
                            noPlaceholder={true}
                            alt={`${title} backdrop`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                         <h3 className="text-white font-bold text-md truncate">{title}</h3>
                         {releaseDate && <p className="text-xs text-white/80">{formatDate(releaseDate, timezone)}</p>}
                    </div>
                    {isCompleted && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white pointer-events-none">
                            <CheckCircleIcon className="w-10 h-10" />
                            <span className="font-bold mt-1">Watched</span>
                        </div>
                    )}
                </div>
                <div className="w-full mt-2 grid grid-cols-4 gap-1.5">
                    <button onClick={handleFavoriteClick} className={`flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors ${isFavorite ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`} title="Favorite">
                        <HeartIcon filled={isFavorite} className="w-4 h-4" />
                    </button>
                    <button onClick={handleMarkWatchedClick} disabled={isCompleted} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100" title="Mark as Watched">
                        <CheckCircleIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleCalendarClick} disabled={isCompleted} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100" title="Set Watched Date">
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleAddClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors" title="Add to List">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );
};


interface NewReleasesProps {
  mediaType?: 'tv' | 'movie';
  title: string;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  timezone?: string;
  onViewMore?: () => void;
}

const NewReleases: React.FC<NewReleasesProps> = ({ mediaType, title, onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, completed, timezone = 'Etc/UTC', onViewMore }) => {
    const [releases, setReleases] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReleases = async () => {
            setLoading(true);
            try {
                let combined: TmdbMedia[] = [];
                if (mediaType) {
                    combined = await getNewReleases(mediaType);
                } else {
                    const [tv, movies] = await Promise.all([
                        getNewReleases('tv'),
                        getNewReleases('movie')
                    ]);
                    combined = [...tv, ...movies];
                }
                
                combined.sort((a, b) => {
                    const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
                    const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
                    return dateB - dateA;
                });
                const limitedResults = combined.slice(0, 8); // Limit to 8 for homepage
                setReleases(limitedResults);

            } catch (error) {
                console.error("Failed to fetch new releases", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, [mediaType]);

    if (loading) {
        return (
             <div className="my-8">
                <div className="flex justify-between items-center mb-4 px-6">
                    <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                </div>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 animate-pulse space-x-4 hide-scrollbar">
                    {[...Array(5)].map((_, i) => (
                         <div key={i} className="w-72 flex-shrink-0">
                             <div className="aspect-video bg-bg-secondary rounded-lg"></div>
                             <div className="h-9 bg-bg-secondary rounded-md mt-2"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (releases.length === 0) {
        return null;
    }

    return (
        <div className="my-8">
            <div className="flex justify-between items-center mb-4 px-6">
                <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                {onViewMore && (
                    <button onClick={onViewMore} className="text-sm font-semibold text-primary-accent hover:underline flex items-center">
                        <span>View More</span> <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </button>
                )}
            </div>
            <Carousel>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
                    {releases.map(item => {
                        const isFavorite = favorites.some(fav => fav.id === item.id);
                        const isCompleted = completed.some(c => c.id === item.id);
                        return (
                            <NewReleaseCard 
                                key={`${item.id}-${item.media_type}`}
                                item={item}
                                onSelect={onSelectShow}
                                onAdd={onOpenAddToListModal}
                                onMarkShowAsWatched={onMarkShowAsWatched}
                                onToggleFavoriteShow={onToggleFavoriteShow}
                                isFavorite={isFavorite}
                                isCompleted={isCompleted}
                                timezone={timezone}
                            />
                        );
                    })}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </Carousel>
        </div>
    );
};

export default NewReleases;