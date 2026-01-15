
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserData, CalendarItem, Reminder, TrackedItem, WatchProgress, TmdbMediaDetails, FullSeasonDrop, TmdbSeasonDetails } from '../types';
import { getMediaDetails, getSeasonDetails } from '../services/tmdbService';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, SparklesIcon } from '../components/Icons';
import { formatDate } from '../utils/formatUtils';
import CalendarListItem from '../components/CalendarListItem';
import { getFromCache, setToCache } from '../utils/cacheUtils';

interface CalendarScreenProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  watchProgress: WatchProgress;
  allTrackedItems: TrackedItem[];
}

const formatDateForApi = (date: Date) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

const CalendarScreen: React.FC<CalendarScreenProps> = ({ userData, onSelectShow, timezone, reminders, onToggleReminder, allTrackedItems }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState<Record<string, CalendarItem[]>>({});
    const [loading, setLoading] = useState(true);

    const hasNoData = useMemo(() => allTrackedItems.length === 0 && reminders.length === 0, [allTrackedItems, reminders]);

    const fetchCalendarData = useCallback(async (date: Date) => {
        if (hasNoData) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDate = formatDateForApi(firstDayOfMonth);
        const endDate = formatDateForApi(lastDayOfMonth);
        
        // Use a cache key that respects user's tracking list count to refresh when they add items
        const cacheKey = `personal_calendar_v3_${allTrackedItems.length}_${year}-${month}`;
        const cached = getFromCache<Record<string, CalendarItem[]>>(cacheKey);
        if(cached) {
            setItems(cached);
            setLoading(false);
            return;
        }

        const shows = allTrackedItems.filter(i => i.media_type === 'tv');
        const movies = allTrackedItems.filter(i => i.media_type === 'movie');

        // Fetch details for all tracked items
        const showDetailPromises = shows.map(s => getMediaDetails(s.id, 'tv').catch(() => null));
        const movieDetailPromises = movies.map(m => getMediaDetails(m.id, 'movie').catch(() => null));
        
        const [showDetails, movieDetails] = await Promise.all([
            Promise.all(showDetailPromises),
            Promise.all(movieDetailPromises),
        ]);

        const calendarItems: CalendarItem[] = [];

        // Process Movies
        movieDetails.forEach(details => {
            if (details?.release_date && details.release_date >= startDate && details.release_date <= endDate) {
                calendarItems.push({
                    id: details.id, media_type: 'movie', poster_path: details.poster_path, title: details.title || '', date: details.release_date, 
                    episodeInfo: 'Movie Release', network: details.production_companies?.[0]?.name, overview: details.overview, 
                    isInCollection: !!details.belongs_to_collection, runtime: details.runtime
                });
            }
        });

        // Process TV Seasons (only for current month range)
        const seasonFetchPromises: Promise<{ showDetails: TmdbMediaDetails, seasonDetail: TmdbSeasonDetails } | null>[] = [];
        showDetails.forEach(details => {
            if (details?.seasons) {
                details.seasons.forEach(season => {
                    if (season.season_number > 0 && season.air_date) {
                        const seasonAirDate = new Date(`${season.air_date}T00:00:00Z`);
                        // Only fetch seasons that might have episodes in our current month view
                        if (seasonAirDate <= lastDayOfMonth) {
                            seasonFetchPromises.push(
                                getSeasonDetails(details.id, season.season_number)
                                    .then(seasonDetail => ({ showDetails: details, seasonDetail }))
                                    .catch(() => null)
                            );
                        }
                    }
                });
            }
        });
        
        const fetchedSeasons = (await Promise.all(seasonFetchPromises)).filter((res): res is { showDetails: TmdbMediaDetails; seasonDetail: TmdbSeasonDetails } => !!res);

        fetchedSeasons.forEach(({ showDetails, seasonDetail }) => {
            seasonDetail.episodes.forEach(ep => {
                if (ep.air_date && ep.air_date >= startDate && ep.air_date <= endDate) {
                    calendarItems.push({
                        id: showDetails.id, media_type: 'tv', poster_path: ep.still_path || showDetails.poster_path, still_path: ep.still_path,
                        title: showDetails.name || 'Untitled', date: ep.air_date,
                        episodeInfo: `S${seasonDetail.season_number} E${ep.episode_number}: ${ep.name}`,
                        network: showDetails.networks?.[0]?.name, overview: ep.overview, runtime: ep.runtime,
                    });
                }
            });
        });

        // Add reminders for unreleased movies that might not be in the monthly range yet
        reminders.forEach(r => {
            if (r.mediaType === 'movie' && r.releaseDate >= startDate && r.releaseDate <= endDate) {
                // Prevent duplicates if already added from movieDetails
                if (!calendarItems.some(i => i.id === r.mediaId && i.date === r.releaseDate)) {
                    calendarItems.push({
                        id: r.mediaId, media_type: 'movie', poster_path: r.poster_path, title: r.title, date: r.releaseDate,
                        episodeInfo: 'Movie Release (Reminder Set)',
                    });
                }
            }
        });
        
        const grouped = calendarItems.reduce((acc, item) => {
            (acc[item.date] = acc[item.date] || []).push(item);
            return acc;
        }, {} as Record<string, CalendarItem[]>);
        
        setToCache(cacheKey, grouped, 6 * 60 * 60 * 1000);
        setItems(grouped);
        setLoading(false);
    }, [allTrackedItems, reminders, hasNoData]);

    useEffect(() => {
        fetchCalendarData(currentDate);
    }, [currentDate, fetchCalendarData]);

    const sortedDates = useMemo(() => Object.keys(items).sort(), [items]);

    if (hasNoData) {
        return (
            <div className="animate-fade-in max-w-4xl mx-auto px-4 py-20 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mb-6">
                    <CalendarIcon className="w-10 h-10 text-primary-accent" />
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-4">Coming Soon</h1>
                <p className="text-text-secondary max-w-md">
                    Your personalized calendar is currently empty. Once you start tracking shows or movies in your library, their release dates and air times will appear here!
                </p>
                <div className="mt-8 flex items-center space-x-2 text-sm text-primary-accent">
                    <SparklesIcon className="w-5 h-5" />
                    <span>Try searching for your favorite shows to get started.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
            <header className="flex items-center justify-between py-6">
                <h1 className="text-3xl font-bold text-text-primary">Your Timeline</h1>
                <div className="flex items-center space-x-4 bg-bg-secondary rounded-full px-4 py-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="text-text-primary hover:text-primary-accent transition-colors">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-bold min-w-[120px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="text-text-primary hover:text-primary-accent transition-colors">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="space-y-8 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i}>
                            <div className="h-6 w-32 bg-bg-secondary rounded mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-24 bg-bg-secondary rounded-lg w-full"></div>
                                <div className="h-24 bg-bg-secondary rounded-lg w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : sortedDates.length > 0 ? (
                <div className="space-y-10">
                    {sortedDates.map(date => (
                        <section key={date}>
                            <h2 className="text-xl font-bold text-text-primary mb-4 border-b border-bg-secondary pb-2">
                                {formatDate(date, timezone, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h2>
                            <div className="space-y-3">
                                {items[date].map(item => {
                                    const reminderId = `rem-${item.media_type}-${item.id}-${item.date}`;
                                    return (
                                        <CalendarListItem 
                                            key={`${item.id}-${item.date}-${item.episodeInfo}`}
                                            item={item}
                                            onSelect={onSelectShow}
                                            isPast={new Date(`${item.date}T23:59:59`) < new Date()}
                                            isReminderSet={reminders.some(r => r.id === reminderId)}
                                            onToggleReminder={(type) => {
                                                const newReminder: Reminder | null = type ? {
                                                    id: reminderId, mediaId: item.id, mediaType: item.media_type,
                                                    releaseDate: item.date, title: item.title, poster_path: item.poster_path,
                                                    episodeInfo: item.episodeInfo, reminderType: type,
                                                } : null;
                                                onToggleReminder(newReminder, reminderId);
                                            }}
                                            timezone={timezone}
                                            onToggleWatched={() => {}} // Could link to toggle episode logic if desired
                                            isWatched={false}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-bg-secondary/20 rounded-xl">
                    <p className="text-text-secondary">No tracked releases for this month.</p>
                </div>
            )}
        </div>
    );
};

export default CalendarScreen;
