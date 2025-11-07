import React, { useState, useEffect } from 'react';
import { TmdbMedia, TrackedItem } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, HeartIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import { getImageUrl } from '../utils/imageUtils';
import { isNewRelease, getRecentEpisodeCount } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import { getMediaDetails } from '../services/tmdbService';
import ScoreBadge from './ScoreBadge';

interface ActionCardProps {
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    isFavorite: boolean;
    isCompleted: boolean;
    showRatings: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ item, onSelect, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, isFavorite, isCompleted, showRatings }) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    const [recentEpisodeCount, setRecentEpisodeCount] = useState(0);
    
    const posterSrcs = [getImageUrl(item.poster_path, 'w342')];
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date;
    const isNew = isNewRelease(releaseDate);
    
    useEffect(() => {
        let isMounted = true;
        setRecentEpisodeCount(0);

        if (item.media_type === 'tv' && !isNew) {
            getMediaDetails(item.id, 'tv').then(details => {
                if (isMounted) {
                    const count = getRecentEpisodeCount(details);
                    setRecentEpisodeCount(count);
                }
            }).catch(e => console.error(`Failed to check for new episodes for ${item.name}`, e));
        }

        return () => { isMounted = false; };
    }, [item.id, item.media_type, item.name, isNew]);


    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenAddToListModal(item);
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
            <div className="w-full">
                <div 
                    className="relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
                    onClick={() => onSelect(item.id, item.media_type)}
                >
                    {isNew && <NewReleaseOverlay position="top-left" color="cyan" />}
                    {recentEpisodeCount > 0 && (
                        <NewReleaseOverlay 
                            text={recentEpisodeCount > 1 ? "NEW EPISODES" : "NEW EPISODE"} 
                            position="top-right" 
                            color="rose" 
                        />
                    )}
                    <div className="aspect-[2/3]">
                        <FallbackImage 
                            srcs={posterSrcs}
                            placeholder={PLACEHOLDER_POSTER}
                            alt={`${title} poster`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-white font-bold text-sm truncate">{title}</h3>
                                {releaseDate && <p className="text-xs text-white/80">{new Date(releaseDate).getFullYear()}</p>}
                            </div>
                            {showRatings && <ScoreBadge score={item.vote_average || 0} size="sm" />}
                        </div>
                    </div>
                     {isCompleted && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white pointer-events-none">
                            <CheckCircleIcon className="w-8 h-8" />
                            <span className="font-bold mt-1 text-sm">Watched</span>
                        </div>
                    )}
                </div>
                <div className="w-full mt-2 grid grid-cols-4 gap-1.5">
                    <button onClick={handleFavoriteClick} className={`flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors ${isFavorite ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`} title="Favorite">
                        <HeartIcon filled={isFavorite} className="w-4 h-4" />
                    </button>
                    <button onClick={handleMarkWatchedClick} disabled={isCompleted} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors disabled:opacity-50" title="Mark as Watched">
                        <CheckCircleIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleCalendarClick} disabled={isCompleted} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors disabled:opacity-50" title="Set Watched Date">
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

export default ActionCard;