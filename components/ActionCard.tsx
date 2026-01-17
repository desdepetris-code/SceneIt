import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMedia, TrackedItem, TmdbMediaDetails } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, HeartIcon, ChevronDownIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import { getImageUrl } from '../utils/imageUtils';
import { isNewRelease, getRecentEpisodeCount } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import { getMediaDetails } from '../services/tmdbService';

interface ActionCardProps {
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    isFavorite: boolean;
    isCompleted: boolean;
    showRatings: boolean;
    showSeriesInfo?: 'expanded' | 'toggle' | 'hidden';
}

const ActionCard: React.FC<ActionCardProps> = ({ 
    item, 
    onSelect, 
    onOpenAddToListModal, 
    onMarkShowAsWatched, 
    onToggleFavoriteShow, 
    isFavorite, 
    isCompleted, 
    showRatings,
    showSeriesInfo = 'expanded'
}) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    const [recentEpisodeCount, setRecentEpisodeCount] = useState(0);
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [isInfoExpanded, setIsInfoExpanded] = useState(showSeriesInfo === 'expanded');
    
    const posterSrcs = useMemo(() => [getImageUrl(item.poster_path, 'w342')], [item.poster_path]);
    const title = item.title || item.name || 'Untitled';
    const releaseDate = item.release_date || item.first_air_date;
    const isNew = isNewRelease(releaseDate);
    
    useEffect(() => {
        let isMounted = true;
        setRecentEpisodeCount(0);

        getMediaDetails(item.id, item.media_type).then(data => {
            if (isMounted) {
                setDetails(data);
                if (item.media_type === 'tv' && !isNew) {
                    const count = getRecentEpisodeCount(data);
                    setRecentEpisodeCount(count);
                }
            }
        }).catch(e => console.error(`Failed to fetch details for ActionCard ${item.id}`, e));

        return () => { isMounted = false; };
    }, [item.id, item.media_type, isNew]);

    // Sync local expanded state if preference changes
    useEffect(() => {
        if (showSeriesInfo === 'expanded') setIsInfoExpanded(true);
        else if (showSeriesInfo === 'hidden') setIsInfoExpanded(false);
        else if (showSeriesInfo === 'toggle') setIsInfoExpanded(false);
    }, [showSeriesInfo]);

    const ageRating = useMemo(() => {
        if (!details) return null;
        if (item.media_type === 'tv') {
          const usRating = details.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
          return usRating?.rating || null;
        } else {
          const usRelease = details.release_dates?.results?.find(r => r.iso_3166_1 === 'US');
          const theatrical = usRelease?.release_dates?.find(d => d.certification);
          return theatrical?.certification || null;
        }
    }, [details, item.media_type]);

    const getAgeRatingColor = (rating: string) => {
        const r = rating.toUpperCase();
        if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200';
        if (r === 'TV-Y') return 'bg-[#008000] text-white';
        if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black';
        if (r === 'PG-13') return 'bg-[#00008B] text-white';
        if (r === 'TV-14') return 'bg-[#800000] text-white';
        if (r === 'R') return 'bg-[#FF00FF] text-black font-black';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20';
        return 'bg-stone-500 text-white';
    };

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
            title: title,
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

    const toggleInfo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsInfoExpanded(!isInfoExpanded);
    };

    const airYears = useMemo(() => {
        if (item.media_type !== 'tv' || !details) return null;
        const start = details.first_air_date?.substring(0, 4);
        const end = details.status === 'Ended' || details.status === 'Canceled' 
            ? details.last_episode_to_air?.air_date?.substring(0, 4) 
            : 'Present';
        if (!start) return null;
        return start === end ? start : `${start} — ${end}`;
    }, [details, item.media_type]);

    const shouldShowInfoSection = showSeriesInfo !== 'hidden' && item.media_type === 'tv' && details && isInfoExpanded;

    return (
        <>
            <MarkAsWatchedModal
                isOpen={markAsWatchedModalState.isOpen}
                onClose={() => setMarkAsWatchedModalState({ isOpen: false, item: null })}
                mediaTitle={title}
                onSave={handleSaveWatchedDate}
            />
            <div className={`w-full flex flex-col transition-all duration-300 ${isInfoExpanded ? 'z-20 scale-[1.02]' : 'z-0'}`}>
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
                    {ageRating && (
                        <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black rounded-md backdrop-blur-md border border-white/10 z-20 shadow-lg ${getAgeRatingColor(ageRating)}`}>
                            {ageRating}
                        </div>
                    )}
                    <FallbackImage
                        srcs={posterSrcs}
                        placeholder={PLACEHOLDER_POSTER}
                        noPlaceholder={true}
                        alt={title}
                        className="w-full aspect-[2/3] object-cover bg-bg-secondary transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2 pl-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <h3 className="text-white text-xs font-bold text-center w-full">{title}</h3>
                    </div>
                    {isCompleted && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white pointer-events-none">
                            <CheckCircleIcon className="w-10 h-10" />
                            <span className="font-bold mt-1">Watched</span>
                        </div>
                    )}
                    
                    {showSeriesInfo === 'toggle' && item.media_type === 'tv' && (
                        <button 
                            onClick={toggleInfo}
                            className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-30 ${isInfoExpanded ? 'bg-primary-accent text-white rotate-180' : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60'}`}
                            title="More Info"
                        >
                            <ChevronDownIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="w-full mt-2 grid grid-cols-4 gap-1.5">
                    <button onClick={handleFavoriteClick} className={`flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors ${isFavorite ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`} title="Favorite">
                        <HeartIcon filled={isFavorite} className="w-4 h-4" />
                    </button>
                    <button onClick={handleMarkWatchedClick} disabled={isCompleted} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors disabled:opacity-50" title="Mark as Watched">
                        <CheckCircleIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleAddClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-all group overflow-hidden relative" title="Add to List">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleCalendarClick} disabled={isCompleted} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors disabled:opacity-50" title="Set Watched Date">
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Info block: Always show title above the list */}
                {showSeriesInfo !== 'hidden' && (
                    <div className="mt-1.5 p-2 bg-bg-secondary/50 rounded-lg text-xs space-y-1">
                        <p className="font-bold text-text-primary truncate">{title}</p>
                        <div className="flex justify-between text-text-secondary">
                             <span>{item.media_type === 'tv' ? 'TV' : 'Movie'}</span>
                             <span>{(item.release_date || item.first_air_date)?.substring(0, 4)}</span>
                        </div>
                    </div>
                )}

                {/* Expanded Season list section */}
                {shouldShowInfoSection && (
                    <div className="mt-2 p-3 bg-bg-secondary rounded-xl border border-white/5 animate-slide-in-up shadow-inner">
                        <div className="flex flex-col mb-2 pb-2 border-b border-white/5">
                            {/* EXPLICIT SHOW NAME IN SEASONS LIST */}
                            <span className="text-[11px] font-black text-primary-accent uppercase truncate">{title}</span>
                            <div className="flex justify-between items-center mt-0.5">
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-secondary">Seasons</span>
                                <span className="text-[9px] font-bold text-text-secondary/60">{airYears}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                            {details.seasons?.filter(s => s.season_number > 0).map(s => (
                                <div key={s.id} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5 last:border-0">
                                    <span className="font-bold text-text-primary">Season {s.season_number}</span>
                                    <span className="text-text-secondary">{s.episode_count} Ep.</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ActionCard;