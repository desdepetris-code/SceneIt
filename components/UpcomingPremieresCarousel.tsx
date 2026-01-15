
import React, { useState, useEffect } from 'react';
import { discoverMedia } from '../services/tmdbService';
import { TmdbMedia, TrackedItem, Reminder, ReminderType, WatchStatus } from '../types';
import Carousel from './Carousel';
import PremiereCard from './PremiereCard';
import { ChevronRightIcon } from './Icons';

interface UpcomingPremieresCarouselProps {
  title: string;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  completed: TrackedItem[];
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  onViewMore?: () => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
}

const UpcomingPremieresCarousel: React.FC<UpcomingPremieresCarouselProps> = (props) => {
    const { title, onSelectShow, completed, reminders, onToggleReminder, onViewMore, onUpdateLists, onOpenAddToListModal } = props;
    const [media, setMedia] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetcher = async () => {
            const today = new Date().toISOString().split('T')[0];
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
            const endDate = sixtyDaysFromNow.toISOString().split('T')[0];
            return discoverMedia('tv', {
                sortBy: 'popularity.desc',
                'first_air_date.gte': today,
                'first_air_date.lte': endDate,
            });
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                const results = await fetcher();
                const limitedResults = results.slice(0, 10);
                setMedia(limitedResults);
            } catch (error) {
                console.error(`Failed to fetch for carousel`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
             <div className="mb-8">
                <div className="h-8 w-3/4 bg-bg-secondary rounded-md mb-4 px-6"></div>
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
            <div className="flex justify-between items-center mb-4 px-6">
                <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                {onViewMore && (
                    <button onClick={onViewMore} className="text-sm view-more-button flex items-center rounded-full px-3 py-1 transition-colors">
                        <span>View Full Calendar</span> <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </button>
                )}
            </div>
            <Carousel>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
                    {media.map(item => {
                        const isCompleted = completed.some(c => c.id === item.id);
                        const releaseDate = item.first_air_date || item.release_date;
                        const reminderId = releaseDate ? `rem-tv-${item.id}-${releaseDate}` : '';
                        const isReminderSet = reminders.some(r => r.id === reminderId);
                        
                        return (
                            <PremiereCard 
                                key={`${item.id}-${item.media_type}`}
                                item={item}
                                onSelect={onSelectShow}
                                onAddToList={() => onOpenAddToListModal(item)}
                                isCompleted={isCompleted}
                                isReminderSet={isReminderSet}
                                onToggleReminder={(type) => {
                                    const newReminder: Reminder | null = type ? {
                                        id: reminderId, mediaId: item.id, mediaType: 'tv',
                                        releaseDate: releaseDate!, title: item.name || 'Untitled', poster_path: item.poster_path,
                                        episodeInfo: 'Series Premiere', reminderType: type,
                                        // FIX: Add missing required wasDateUnknown property.
                                        wasDateUnknown: !releaseDate,
                                    } : null;
                                    onToggleReminder(newReminder, reminderId);
                                }}
                            />
                        );
                    })}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </Carousel>
        </div>
    );
};

export default UpcomingPremieresCarousel;
