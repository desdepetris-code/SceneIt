import React, { useState, useEffect } from 'react';
import { CalendarItem, TmdbMedia, UserData, TmdbMediaDetails } from '../types';
import { getUpcomingMovies, getMediaDetails } from '../services/tmdbService';
import CalendarCard from './CalendarCard';
import { ChevronRightIcon } from './Icons';
import Carousel from './Carousel';

interface UpcomingCalendarProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
  onViewFullCalendar: () => void;
}

const CalendarCarousel: React.FC<{ items: CalendarItem[]; onSelect: (id: number, media_type: 'tv' | 'movie') => void; timezone: string }> = ({ items, onSelect, timezone }) => (
    <Carousel>
        <div className="flex overflow-x-auto space-x-4 pb-4 -mx-2 px-2 hide-scrollbar">
            {items.map(item => (
                <CalendarCard key={`${item.id}-${item.date}-${item.episodeInfo}`} item={item} onSelect={onSelect} timezone={timezone} />
            ))}
            <div className="w-4 flex-shrink-0"></div>
        </div>
    </Carousel>
);

const UpcomingCalendar: React.FC<UpcomingCalendarProps> = ({ userData, onSelectShow, timezone, onViewFullCalendar }) => {
    const [upcomingTv, setUpcomingTv] = useState<CalendarItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpcoming = async () => {
            setLoading(true);
            try {
                // Personalized TV
                const trackedShows = [...userData.watching, ...userData.planToWatch].filter(i => i.media_type === 'tv');
                const detailPromises = trackedShows.map(show => getMediaDetails(show.id, 'tv').catch(() => null));
                const allDetails = await Promise.all(detailPromises);
                
                const now = new Date();
                const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                const tvItems = allDetails
                    .filter((details): details is TmdbMediaDetails => !!(details && details.next_episode_to_air?.air_date))
                    .filter(details => {
                        const airDate = new Date(details.next_episode_to_air!.air_date);
                        return airDate >= now && airDate <= thirtyDaysFromNow;
                    })
                    .map(details => ({
                        id: details!.id,
                        media_type: 'tv' as const,
                        poster_path: details!.poster_path,
                        title: details!.name || 'Untitled',
                        date: details!.next_episode_to_air!.air_date,
                        episodeInfo: `S${details!.next_episode_to_air!.season_number} E${details!.next_episode_to_air!.episode_number}: ${details!.next_episode_to_air!.name}`,
                        network: details!.networks?.[0]?.name,
                    }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 10);
                
                setUpcomingTv(tvItems);

            } catch (error) {
                console.error("Failed to fetch upcoming calendar items", error);
            }
            setLoading(false);
        };

        fetchUpcoming();
    }, [userData, timezone]);

    return (
        <section className="px-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary halloween-lights-left">Upcoming TV Releases</h2>
                <button onClick={onViewFullCalendar} className="text-sm font-semibold text-primary-accent hover:underline flex items-center">
                    <span>Full Calendar</span> <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
            </div>

            {loading ? (
                 <div className="flex overflow-x-auto space-x-4 pb-4 -mx-2 px-2 hide-scrollbar animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-40 flex-shrink-0">
                            <div className="h-60 bg-bg-secondary rounded-lg"></div>
                            <div className="h-4 bg-bg-secondary rounded mt-2 w-3/4"></div>
                            <div className="h-3 bg-bg-secondary rounded mt-1 w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : (
                (upcomingTv.length > 0) ? (
                    <div className="space-y-6">
                        {upcomingTv.length > 0 && (
                            <div>
                                <CalendarCarousel items={upcomingTv} onSelect={onSelectShow} timezone={timezone} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full text-center py-10 bg-bg-secondary/30 rounded-lg">
                        <p className="text-text-secondary">No upcoming TV releases on your lists.</p>
                    </div>
                )
            )}
        </section>
    );
};

export default UpcomingCalendar;