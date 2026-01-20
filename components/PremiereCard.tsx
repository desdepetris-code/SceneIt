import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMedia, TrackedItem, ReminderType, TmdbMediaDetails } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, BellIcon, HeartIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_BACKDROP } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import { isNewRelease } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import ReminderOptionsModal from './ReminderOptionsModal';
import { getMediaDetails } from '../services/tmdbService';

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

interface PremiereCardProps {
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onAddToList: () => void;
    onToggleReminder: (type: ReminderType | null) => void;
    isReminderSet: boolean;
    isCompleted: boolean;
}

const PremiereCard: React.FC<PremiereCardProps> = ({ item, onSelect, onAddToList, onToggleReminder, isReminderSet, isCompleted }) => {
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    
    useEffect(() => {
        let isMounted = true;
        getMediaDetails(item.id, item.media_type).then(data => {
            if (isMounted) setDetails(data);
        }).catch(() => {});
        return () => { isMounted = false; };
    }, [item.id, item.media_type]);

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
        if (r === 'TV-Y') return 'bg-[#008000] text-white';
        if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black';
        if (r === 'PG-13') return 'bg-[#00008B] text-white';
        if (r === 'TV-14') return 'bg-[#800000] text-white';
        if (r === 'R') return 'bg-[#FF00FF] text-black font-black';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-md';
        return 'bg-slate-500 text-white';
    };

    const backdropSrcs = [
        getFullImageUrl(item.backdrop_path, 'w500'),
        getFullImageUrl(item.poster_path, 'w342'),
    ];
    const title = item.title || item.name;
    const isNew = isNewRelease(item.release_date || item.first_air_date);

    const handleAddToListClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToList();
    };
    
    const handleReminderClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isReminderSet) {
            onToggleReminder(null);
        } else {
            setIsReminderModalOpen(true);
        }
    };
    const handleSelectReminderType = (type: ReminderType) => {
        onToggleReminder(type);
        setIsReminderModalOpen(false);
    };

    return (
        <>
            <ReminderOptionsModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                onSelect={handleSelectReminderType}
            />
            <div className="w-72 flex-shrink-0 h-full">
                <div 
                    className="relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
                    onClick={() => onSelect(item.id, item.media_type)}
                >
                    {isNew && <NewReleaseOverlay position="top-left" color="cyan" />}
                    {ageRating && (
                        <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black rounded-md backdrop-blur-md border border-white/10 z-20 shadow-lg ${getAgeRatingColor(ageRating)}`}>
                            {ageRating}
                        </div>
                    )}
                    <div className="aspect-video">
                        <FallbackImage 
                            srcs={backdropSrcs}
                            placeholder={PLACEHOLDER_BACKDROP}
                            alt={`${title} backdrop`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                         <h3 className="text-white font-bold text-md truncate">{title}</h3>
                    </div>
                    {isCompleted && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white pointer-events-none">
                            <CheckCircleIcon className="w-10 h-10" />
                            <span className="font-bold mt-1">Watched</span>
                        </div>
                    )}
                </div>
                <div className="w-full mt-2 grid grid-cols-2 gap-1.5">
                    <button onClick={handleReminderClick} className={`flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors ${isReminderSet ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`} title="Set Reminder">
                        <BellIcon filled={isReminderSet} className="w-4 h-4" />
                        <span>Reminder</span>
                    </button>
                    <button onClick={handleAddToListClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors" title="Add to List">
                        <PlusIcon className="w-4 h-4" />
                        <span>Add to List</span>
                    </button>
                </div>
                {(item.first_air_date || item.release_date) && (
                    <div className="mt-1.5 p-2 bg-bg-secondary/50 rounded-lg text-center">
                        <p className="text-xs font-semibold text-text-secondary">Premieres</p>
                        <p className="text-sm font-bold text-text-primary">
                            {new Date((item.first_air_date || item.release_date) + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default PremiereCard;