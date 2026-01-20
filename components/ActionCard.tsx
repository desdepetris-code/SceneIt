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
import UserRatingStamp from './UserRatingStamp';

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
    userRating?: number;
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
    showSeriesInfo = 'expanded',
    userRating = 0
}) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    const [recentEpisodeCount, setRecentEpisodeCount] = useState(0);
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [isInfoExpanded, setIsInfoExpanded] = useState(showSeriesInfo === 'expanded');
    
    const posterSrcs = useMemo(() => [getImageUrl(item.poster_path, 'w500')], [item.poster_path]);
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
        if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
        if (r === 'TV-Y') return 'bg-[#008000] text-white shadow-sm';
        if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black shadow-md';
        if (r === 'PG-13') return 'bg-[#00008B] text-white shadow-md';
        if (r === 'TV-14') return 'bg-[#800000] text-white shadow-md';
        if (r === 'R') return 'bg-[#FF00FF] text-black font-black shadow-lg';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-2xl';
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
                onSave={(data) => onMarkShowAsWatched(item, data.date)}
            />
            <div className={`w-full flex flex-col transition-all duration-300 ${isInfoExpanded ? 'z-20' : 'z-0'} group/card`}>
                <div 
                    className="relative rounded-[1.5rem] overflow-hidden shadow-2xl bg-bg-secondary/20 border border-white/5 cursor-pointer"
                    onClick={() => onSelect(item.id, item.media_type)}
                >
                    {isNew && <NewReleaseOverlay position="top-left" color="cyan" className="scale-110 md:scale-125 origin-top-left" />}
                    <UserRatingStamp rating={userRating} className="absolute -top-1 -left-1 scale-110 md:scale-125 z-30" />
                    
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-20">
                        {ageRating && (
                            <div className={`px-2 py-1 text-[10px] md:text-xs font-black rounded-lg backdrop-blur-md border border-white/10 shadow-2xl ${getAgeRatingColor(ageRating)}`}>
                                {ageRating}
                            </div>
                        )}
                        {recentEpisodeCount > 0 && (
                            <NewReleaseOverlay 
                                text={recentEpisodeCount > 1 ? `${recentEpisodeCount} NEW EPISODES` : 'NEW EPISODE'} 
                                position="static"
                                color="rose"
                                className="scale-105 md:scale-110"
                            />
                        )}
                    </div>

                    <div className="aspect-[2/3] overflow-hidden">
                        <FallbackImage
                            srcs={posterSrcs}
                            placeholder={PLACEHOLDER_POSTER}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                            loading="lazy"
                        />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-4 opacity-0 group-hover/card:opacity-100 transition-all duration-500 translate-y-2 group-hover/card:translate-y-0">
                         <h3 className="text-white text-xs md:text-sm font-black uppercase tracking-tight text-center w-full leading-tight drop-shadow-lg">{title}</h3>
                    </div>

                    {isCompleted && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white pointer-events-none animate-fade-in">
                            <CheckCircleIcon className="w-12 h-12 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                            <span className="font-black uppercase tracking-[0.2em] text-[10px] mt-2">Captured</span>
                        </div>
                    )}
                    
                    {showSeriesInfo === 'toggle' && item.media_type === 'tv' && (
                        <button 
                            onClick={toggleInfo}
                            className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-30 shadow-xl border border-white/10 ${isInfoExpanded ? 'bg-primary-accent text-white rotate-180' : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60'}`}
                            title="More Info"
                        >
                            <ChevronDownIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="w-full mt-3 grid grid-cols-4 gap-2 px-1">
                    <button onClick={handleFavoriteClick} className={`flex items-center justify-center py-2.5 rounded-xl transition-all shadow-md border ${isFavorite ? 'bg-primary-accent/20 border-primary-accent/40 text-primary-accent' : 'bg-bg-secondary/60 border-white/5 text-text-primary hover:bg-bg-secondary hover:scale-105'}`} title="Favorite">
                        <HeartIcon filled={isFavorite} className="w-5 h-5" />
                    </button>
                    <button onClick={handleMarkWatchedClick} disabled={isCompleted} className="flex items-center justify-center py-2.5 rounded-xl bg-bg-secondary/60 border border-white/5 text-text-primary hover:bg-bg-secondary hover:scale-105 transition-all shadow-md disabled:opacity-30 disabled:hover:scale-100" title="Quick Log">
                        <CheckCircleIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleAddClick} className="flex items-center justify-center py-2.5 rounded-xl bg-bg-secondary/60 border border-white/5 text-text-primary hover:bg-bg-secondary hover:scale-105 transition-all shadow-md" title="Add to List">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleCalendarClick} disabled={isCompleted} className="flex items-center justify-center py-2.5 rounded-xl bg-bg-secondary/60 border border-white/5 text-text-primary hover:bg-bg-secondary hover:scale-105 transition-all shadow-md disabled:opacity-30" title="Log with Date">
                        <CalendarIcon className="w-5 h-5" />
                    </button>
                </div>

                {showSeriesInfo !== 'hidden' && (
                    <div className="mt-2 p-2 bg-bg-secondary/20 rounded-xl text-center shadow-inner border border-white/5">
                        <p className="font-black text-text-primary truncate text-xs uppercase tracking-tight">{title}</p>
                        <div className="flex justify-center items-center space-x-3 text-[10px] font-bold text-text-secondary opacity-60 mt-0.5">
                             <span className="uppercase tracking-widest">{item.media_type === 'tv' ? 'Series' : 'Film'}</span>
                             <span>•</span>
                             <span>{(item.release_date || item.first_air_date)?.substring(0, 4)}</span>
                        </div>
                    </div>
                )}

                {shouldShowInfoSection && (
                    <div className="mt-2 p-4 bg-bg-secondary/40 rounded-2xl border border-white/10 animate-slide-in-up shadow-2xl backdrop-blur-md">
                        <div className="flex flex-col mb-3 pb-2 border-b border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent">Runtime Timeline</span>
                                <span className="text-[9px] font-black text-text-secondary tracking-widest">{airYears}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                            {details.seasons?.filter(s => s.season_number > 0).map(s => (
                                <div key={s.id} className="flex justify-between items-center text-[10px] py-2 border-b border-white/5 last:border-0 group/season">
                                    <span className="font-black text-text-primary uppercase tracking-tighter">Season {s.season_number}</span>
                                    <span className="text-text-secondary font-bold group-hover/season:text-primary-accent transition-colors">{s.episode_count} Episodes</span>
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