import React, { useState, useEffect } from 'react';
import { getUpcomingTvPremieres } from '../services/tmdbService';
import { TmdbMedia, Reminder, ReminderType } from '../types';
import PremiereCard from './PremiereCard';
import Carousel from './Carousel';

interface UpcomingPremieresCarouselProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  timezone: string;
}

const UpcomingPremieresCarousel: React.FC<UpcomingPremieresCarouselProps> = ({ onSelectShow, reminders, onToggleReminder, timezone }) => {
    const [premieres, setPremieres] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPremieres = async () => {
            setLoading(true);
            try {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const startDate = tomorrow.toISOString().split('T')[0];
                
                const data = await getUpcomingTvPremieres(1, startDate);
                setPremieres(data.results.slice(0, 10));
            } catch (error) {
                console.error("Failed to fetch upcoming premieres", error);
            }
            setLoading(false);
        };
        fetchPremieres();
    }, []);

    if (loading) {
        return (
             <div className="my-8 px-6 animate-pulse">
                <div className="h-8 w-1/2 bg-bg-secondary rounded-md mb-4"></div>
                <div className="flex space-x-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-72 flex-shrink-0">
                             <div className="aspect-video bg-bg-secondary rounded-lg"></div>
                             <div className="h-9 bg-bg-secondary rounded-md mt-2"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    
    if (premieres.length === 0) return null;

    return (
        <section className="my-8 px-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text-primary">Upcoming TV Premieres</h2>
            </div>
            <Carousel>
                <div className="flex overflow-x-auto space-x-4 pb-4 -mx-2 px-2 hide-scrollbar">
                    {premieres.map(item => {
                        const reminderId = `rem-${item.media_type}-${item.id}-${item.first_air_date}`;
                        const isReminderSet = reminders.some(r => r.id === reminderId);
                        const handleToggleReminder = (type: ReminderType | null) => {
                            const newReminder: Reminder | null = type ? {
                                id: reminderId,
                                mediaId: item.id,
                                mediaType: item.media_type,
                                releaseDate: item.first_air_date || '',
                                title: item.name || '',
                                poster_path: item.poster_path,
                                episodeInfo: 'Series Premiere',
                                reminderType: type,
                            } : null;
                            onToggleReminder(newReminder, reminderId);
                        };

                        return (
                            <PremiereCard
                                key={item.id}
                                item={item}
                                onSelect={onSelectShow}
                                onAdd={() => {}} // Not used here
                                onMarkShowAsWatched={() => {}} // Not applicable for premieres
                                onToggleReminder={handleToggleReminder}
                                isReminderSet={isReminderSet}
                                isCompleted={false}
                            />
                        );
                    })}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </Carousel>
        </section>
    );
};

export default UpcomingPremieresCarousel;