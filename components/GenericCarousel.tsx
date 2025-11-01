import React, { useState, useEffect } from 'react';
import { TmdbMedia, TrackedItem } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, HeartIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_BACKDROP } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import { isNewRelease } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import RecommendationHint from './RecommendationHint';
import { getAIReasonsForMedia } from '../services/genaiService';
import Carousel from './Carousel';

// FIX: Hoisted getFullImageUrl to prevent "used before declaration" error.
const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

const CarouselCard: React.FC<{
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onAdd: (item: TmdbMedia) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    isFavorite: boolean;
    isCompleted: boolean;
    recommendationReason?: string;
}> = ({ item, onSelect, onAdd, onMarkShowAsWatched, onToggleFavoriteShow, isFavorite, isCompleted, recommendationReason }) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    const backdropSrcs = [
        getFullImageUrl(item.backdrop_path, 'w500'),
        getFullImageUrl(item.poster_path, 'w342'),
    ];
    const title = item.title || item.name;
    const isNew = isNewRelease(item.release_date || item.first_air_date);

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
                         {recommendationReason && <RecommendationHint reason={recommendationReason} />}
                         <h3 className="text-white font-bold text-md truncate">{title}</h3>
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

interface GenericCarouselProps {
  title: string;
  fetcher: () => Promise<TmdbMedia[]>;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  recommendationReason?: string;
}

const GenericCarousel: React.FC<GenericCarouselProps> = ({ title, fetcher, onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, completed, recommendationReason }) => {
    const [media, setMedia] = useState<TmdbMedia[]>([]);
    const [reasons, setReasons] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setReasons({});
            try {
                const results = await fetcher();
                const limitedResults = results.slice(0, 10);
                setMedia(limitedResults);

                if (limitedResults.length > 0) {
                    getAIReasonsForMedia(limitedResults).then(setReasons).catch(aiError => {
                        console.warn(`Could not fetch AI reasons for carousel "${title}":`, aiError);
                    });
                }
            } catch (error) {
                console.error(`Failed to fetch for carousel "${title}"`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fetcher, title]);

    if (loading) {
        return (
             <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">{title}</h2>
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

    if (media.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">{title}</h2>
            <Carousel>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
                    {media.map(item => {
                        const isFavorite = favorites.some(fav => fav.id === item.id);
                        const isCompleted = completed.some(c => c.id === item.id);
                        return (
                            <CarouselCard 
                                key={`${item.id}-${item.media_type}`}
                                item={item}
                                onSelect={onSelectShow}
                                onAdd={onOpenAddToListModal}
                                onMarkShowAsWatched={onMarkShowAsWatched}
                                onToggleFavoriteShow={onToggleFavoriteShow}
                                isFavorite={isFavorite}
                                isCompleted={isCompleted}
                                recommendationReason={reasons[item.id] || recommendationReason}
                            />
                        );
                    })}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </Carousel>
        </div>
    );
};

export default GenericCarousel;