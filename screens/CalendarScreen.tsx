import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserData, CalendarItem, Reminder, TrackedItem, WatchProgress, TmdbMediaDetails, TmdbSeasonDetails, EpisodeProgress } from '../types';
import { getMediaDetails, getSeasonDetails } from '../services/tmdbService';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CalendarIcon, SparklesIcon, ListBulletIcon, Squares2X2Icon } from '../components/Icons';
import { formatDate } from '../utils/formatUtils';
import CalendarListItem from '../components/CalendarListItem';
import { getFromCache, setToCache } from '../utils/cacheUtils';
import CalendarPickerModal from '../components/MonthYearPicker';

interface CalendarScreenProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  watchProgress: WatchProgress;
}

const formatDateForApi = (date: Date) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

const CalendarScreen: React.FC<CalendarScreenProps> = ({ userData, onSelectShow, timezone, reminders, onToggleReminder, watchProgress }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
    const [items, setItems] = useState<Record<string, CalendarItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Personalized collection for calendar: Includes everything except what the user specifically paused or quit.
    const relevantTrackedItems = useMemo(() => {
        const excludeIds = new Set([
            ...userData.onHold.map(i => i.id),
            ...userData.dropped.map(i => i.id)
        ]);

        const combined = [...userData.watching, ...userData.planToWatch, ...userData.allCaughtUp, ...userData.completed];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return unique.filter(item => !excludeIds.has(item.id));
    }, [userData.watching, userData.planToWatch, userData.onHold, userData.dropped, userData.allCaughtUp, userData.completed]);

    const hasNoData = useMemo(() => relevantTrackedItems.length === 0 && reminders.length === 0, [relevantTrackedItems, reminders]);

    const fetchCalendarData = useCallback(async (date: Date, mode: 'day' | 'month') => {
        if (hasNoData) {
            setLoading(false);
            return;
        }
        setLoading(true);
        
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        let startDateStr: string;
        let endDateStr: string;
        let cacheKey: string;

        if (mode === 'day') {
            const startOfDay = new Date(year, month, day);
            startDateStr = formatDateForApi(startOfDay);
            endDateStr = startDateStr;
            cacheKey = `personal_calendar_v6_day_${relevantTrackedItems.length}_${startDateStr}`;
        } else {
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);
            startDateStr = formatDateForApi(firstDayOfMonth);
            endDateStr = formatDateForApi(lastDayOfMonth);
            cacheKey = `personal_calendar_v6_month_${relevantTrackedItems.length}_${year}-${month}`;
        }
        
        const cached = getFromCache<Record<string, CalendarItem[]>>(cacheKey);
        if(cached) {
            setItems(cached);
            setLoading(false);
            return;
        }

        const shows = relevantTrackedItems.filter(i => i.media_type === 'tv');
        const movies = relevantTrackedItems.filter(i => i.media_type === 'movie');

        // Batch fetch media details for all tracked items
        const showDetailPromises = shows.map(s => getMediaDetails(s.id, 'tv').catch(() => null));
        const movieDetailPromises = movies.map(m => getMediaDetails(m.id, 'movie').catch(() => null));
        
        const [showDetails, movieDetails] = await Promise.all([
            Promise.all(showDetailPromises),
            Promise.all(movieDetailPromises),
        ]);

        const calendarItems: CalendarItem[] = [];

        // Process Movie Releases
        movieDetails.forEach(details => {
            if (details?.release_date && details.release_date >= startDateStr && details.release_date <= endDateStr) {
                calendarItems.push({
                    id: details.id, media_type: 'movie', poster_path: details.poster_path, title: details.title || '', date: details.release_date, 
                    episodeInfo: 'Movie Release', network: details.production_companies?.[0]?.name, overview: details.overview, 
                    isInCollection: !!details.belongs_to_collection, runtime: details.runtime
                });
            }
        });

        // Process TV Episode Releases
        const seasonFetchPromises: Promise<{ showDetails: TmdbMediaDetails, seasonDetail: TmdbSeasonDetails } | null>[] = [];
        showDetails.forEach(details => {
            if (details?.seasons) {
                details.seasons.forEach(season => {
                    if (season.season_number > 0 && season.air_date) {
                        seasonFetchPromises.push(
                            getSeasonDetails(details.id, season.season_number)
                                .then(seasonDetail => ({ showDetails: details, seasonDetail }))
                                .catch(() => null)
                        );
                    }
                });
            }
        });
        
        const fetchedSeasons = (await Promise.all(seasonFetchPromises)).filter((res): res is { showDetails: TmdbMediaDetails; seasonDetail: TmdbSeasonDetails } => !!res);

        fetchedSeasons.forEach(({ showDetails, seasonDetail }) => {
            seasonDetail.episodes.forEach(ep => {
                if (ep.air_date && ep.air_date >= startDateStr && ep.air_date <= endDateStr) {
                    calendarItems.push({
                        id: showDetails.id, media_type: 'tv', poster_path: ep.still_path || showDetails.poster_path, still_path: ep.still_path,
                        title: showDetails.name || 'Untitled', date: ep.air_date,
                        episodeInfo: `S${seasonDetail.season_number} E${ep.episode_number}: ${ep.name}`,
                        network: showDetails.networks?.[0]?.name, overview: ep.overview, runtime: ep.runtime,
                    });
                }
            });
        });

        // Inject active reminders if not already present via TMDB data
        reminders.forEach(r => {
            if (r.releaseDate >= startDateStr && r.releaseDate <= endDateStr) {
                if (!calendarItems.some(i => i.id === r.mediaId && i.date === r.releaseDate)) {
                    calendarItems.push({
                        id: r.mediaId, media_type: r.mediaType, poster_path: r.poster_path, title: r.title, date: r.releaseDate,
                        episodeInfo: r.episodeInfo || (r.mediaType === 'movie' ? 'Movie Release' : 'Airing'),
                    });
                }
            }
        });
        
        const grouped = calendarItems.reduce((acc, item) => {
            (acc[item.date] = acc[item.date] || []).push(item);
            return acc;
        }, {} as Record<string, CalendarItem[]>);
        
        setToCache(cacheKey, grouped, 12 * 60 * 60 * 1000); // 12h cache
        setItems(grouped);
        setLoading(false);
    }, [relevantTrackedItems, reminders, hasNoData]);

    useEffect(() => {
        fetchCalendarData(currentDate, viewMode);
    }, [currentDate, viewMode, fetchCalendarData]);

    const handlePrev = () => {
        const next = new Date(currentDate);
        if (viewMode === 'day') next.setDate(currentDate.getDate() - 1);
        else next.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(next);
    };

    const handleNext = () => {
        const next = new Date(currentDate);
        if (viewMode === 'day') next.setDate(currentDate.getDate() + 1);
        else next.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(next);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const sortedDates = useMemo(() => Object.keys(items).sort(), [items]);

    if (hasNoData) {
        return (
            <div className="animate-fade-in max-w-4xl mx-auto px-4 py-20 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mb-6">
                    <CalendarIcon className="w-10 h-10 text-primary-accent" />
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-4">Timeline Empty</h1>
                <p className="text-text-secondary max-w-md">
                    Start tracking shows or movies to see your personalized release history and future schedule.
                </p>
                <div className="mt-8 flex items-center space-x-2 text-sm text-primary-accent">
                    <SparklesIcon className="w-5 h-5" />
                    <span>Historical releases from your library appear here automatically.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-20">
            <CalendarPickerModal 
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                mode={viewMode === 'day' ? 'full' : 'month-year'}
            />
            
            <header className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary uppercase tracking-tight">Timeline</h1>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1 opacity-60">Personalized cinematic map</p>
                </div>

                <div className="flex items-center bg-bg-secondary p-1 rounded-2xl border border-white/5 self-start">
                    <button 
                        onClick={() => setViewMode('day')}
                        className={`flex items-center space-x-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'day' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}
                    >
                        <ListBulletIcon className="w-4 h-4" />
                        <span>Daily</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('month')}
                        className={`flex items-center space-x-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'month' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}
                    >
                        <Squares2X2Icon className="w-4 h-4" />
                        <span>Monthly</span>
                    </button>
                </div>
            </header>

            <div className="flex items-center justify-between bg-bg-secondary/40 backdrop-blur-md rounded-3xl p-2 border border-white/5 mb-8 shadow-xl">
                <button onClick={handlePrev} className="p-3 bg-bg-primary rounded-2xl text-text-primary hover:text-primary-accent transition-all shadow-md">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="text-center flex flex-col items-center">
                    <button onClick={handleToday} className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-accent mb-1 hover:underline">Return to Today</button>
                    <button 
                        onClick={() => setIsPickerOpen(true)}
                        className="group flex items-center gap-2 px-6 py-1 rounded-xl hover:bg-bg-primary/40 transition-colors"
                    >
                        <span className="text-lg font-black text-text-primary uppercase tracking-tight group-hover:text-primary-accent transition-colors">
                            {viewMode === 'day' 
                                ? formatDate(currentDate.toISOString(), timezone, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                                : currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                            }
                        </span>
                        <ChevronDownIcon className="w-4 h-4 text-text-secondary opacity-40 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
                <button onClick={handleNext} className="p-3 bg-bg-primary rounded-2xl text-text-primary hover:text-primary-accent transition-all shadow-md">
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>

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
                        <section key={date} className="animate-slide-in-up">
                            <h2 className="text-xl font-black text-text-primary mb-4 border-b border-white/5 pb-2 uppercase tracking-widest">
                                {formatDate(date, timezone, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </h2>
                            <div className="space-y-3">
                                {items[date].map(item => {
                                    const reminderId = `rem-${item.media_type}-${item.id}-${item.date}`;
                                    const isEpWatched = item.media_type === 'tv' && (watchProgress[item.id]?.[Number(item.episodeInfo.match(/S(\d+)/)?.[1])]?.[Number(item.episodeInfo.match(/E(\d+)/)?.[1])])?.status === 2;
                                    const isMovieWatched = item.media_type === 'movie' && userData.completed.some(c => c.id === item.id);

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
                                            onToggleWatched={() => {}}
                                            isWatched={isEpWatched || isMovieWatched}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-bg-secondary/20 rounded-3xl border-4 border-dashed border-white/5 flex flex-col items-center">
                    <CalendarIcon className="w-16 h-16 text-text-secondary/10 mb-4" />
                    <p className="text-text-secondary font-black uppercase tracking-widest text-sm">Nothing found for this {viewMode}</p>
                </div>
            )}
        </div>
    );
};

export default CalendarScreen;