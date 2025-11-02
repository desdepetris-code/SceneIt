import React, { useState } from 'react';
import { TmdbMedia, TrackedItem, ReminderType } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, BellIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_BACKDROP } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import { isNewRelease } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import ReminderOptionsModal from './ReminderOptionsModal';

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

interface PremiereCardProps {
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onAdd: (item: TmdbMedia) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleReminder: (type: ReminderType | null) => void;
    isReminderSet: boolean;
    isCompleted: boolean;
}

const PremiereCard: React.FC<PremiereCardProps> = ({ item, onSelect, onAdd, onMarkShowAsWatched, onToggleReminder, isReminderSet, isCompleted }) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    
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
            <MarkAsWatchedModal
                isOpen={markAsWatchedModalState.isOpen}
                onClose={() => setMarkAsWatchedModalState({ isOpen: false, item: null })}
                mediaTitle={markAsWatchedModalState.item?.title || markAsWatchedModalState.item?.name || ''}
                onSave={handleSaveWatchedDate}
            />
            <ReminderOptionsModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                onSelect={handleSelectReminderType}
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
                    </div>
                    {isCompleted && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white pointer-events-none">
                            <CheckCircleIcon className="w-10 h-10" />
                            <span className="font-bold mt-1">Watched</span>
                        </div>
                    )}
                </div>
                <div className="w-full mt-2 grid grid-cols-4 gap-1.5">
                    <button onClick={handleReminderClick} className={`flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors ${isReminderSet ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`} title="Set Reminder">
                        <BellIcon filled={isReminderSet} className="w-4 h-4" />
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

export default PremiereCard;
