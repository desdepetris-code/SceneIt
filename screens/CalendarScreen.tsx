import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { UserData, CalendarItem, Reminder, TrackedItem, WatchProgress, TmdbMediaDetails, FullSeasonDrop, TmdbSeasonDetails, TmdbMedia } from '../types';
import { getMediaDetails, getSeasonDetails, getUpcomingMovieReleases, getUpcomingTvPremieres } from '../services/tmdbService';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from './Icons';
import { formatDate } from '../utils/formatUtils';
import MonthYearPicker from '../components/MonthYearPicker';
import CalendarListItem from '../components/CalendarListItem';
import FullSeasonDropItem from '../components/FullSeasonDropItem';
import { getImageUrl } from '../utils/imageUtils';
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

// --- MY CALENDAR VIEW ---
const MyCalendarView: React.FC<Omit<CalendarScreenProps, 'reminders' | 'onToggleReminder' | 'onToggleEpisode'>> = ({ userData, onSelectShow, timezone, watchProgress, allTrackedItems }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState<Record<string, (CalendarItem | FullSeasonDrop)[]>>({});
    const [loading, setLoading] = useState(true);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [displayMode, setDisplayMode] = useState<'daily' | 'monthly'>('daily');
    const [selectedDailyDate, setSelectedDailyDate] = useState(new Date());

    const fetchMyCalendarData = useCallback(async (date: Date) => {
        setLoading(true);
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDate = formatDateForApi(firstDayOfMonth);
        const endDate = formatDateForApi(lastDayOfMonth);
        
        const cacheKey = `my_calendar_data_v2_${allTrackedItems.length}_${year}-${month}`;
        const cached = getFromCache<Record<string, (CalendarItem | FullSeasonDrop)[]>>(cacheKey);
        if(cached) {
            setItems(cached);
            setLoading(false);
            return;
        }

        const shows = allTrackedItems.filter(i => i.media_type === 'tv');
        const movies = allTrackedItems.filter(i => i.media_type === 'movie');

        const showDetailPromises = shows.map(s => getMediaDetails(s.id, 'tv').catch(() => null));
        const movieDetailPromises = movies.map(m => getMediaDetails(m.id, 'movie').catch(() => null));
        
        const [showDetails, movieDetails] = await Promise.all([
            Promise.all(showDetailPromises),
            Promise.all(movieDetailPromises),
        ]);

        const calendarItems: CalendarItem[] = [];
        movieDetails.forEach(details => {
            if (details?.release_date && details.release_date >= startDate && details.release_date <= endDate) {
                calendarItems.push({
                    id: details.id, media_type: 'movie', poster_path: details.poster_path, title: details.title || '', date: details.release_date, 
                    episodeInfo: 'Movie Release', network: details.production_companies?.[0]?.name, overview: details.overview, 
                    isInCollection: !!details.belongs_to_collection, runtime: details.runtime
                });
            }
        });

        const seasonFetchPromises: Promise<{ showDetails: TmdbMediaDetails, seasonDetail: TmdbSeasonDetails } | null>[] = [];
        showDetails.forEach(details => {
            if (details?.seasons) {
                details.seasons.forEach(season => {
                    const seasonAirDate = season.air_date ? new Date(`${season.air_date}T00:00:00Z`) : null;
                    if (season.season_number > 0 && seasonAirDate && seasonAirDate <= lastDayOfMonth && seasonAirDate >= new Date(year, month - 1, 1)) {
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
                if (ep.air_date && ep.air_date >= startDate && ep.air_date <= endDate) {
                    calendarItems.push({
                        id: showDetails.id, media_type: 'tv', poster_path: ep.still_path || showDetails.poster_path, still_path: ep.still_path,
                        title: showDetails.name || 'Untitled', date: ep.air_date,
                        episodeInfo: `S${String(seasonDetail.season_number).padStart(2, '0')} E${String(ep.episode_number).padStart(2, '0')}: ${ep.name || 'TBA'}`,
                        network: showDetails.networks?.[0]?.name, overview: ep.overview, runtime: ep.runtime,
                    });
                }
            });
        });
        
        const grouped = calendarItems.reduce((acc, item) => {
            (acc[item.date] = acc[item.date] || []).push(item);
            return acc;
        }, {} as Record<string, CalendarItem[]>);
        
        setToCache(cacheKey, grouped, 6 * 60 * 60 * 1000);
        setItems(grouped);
        setLoading(false);
    }, [allTrackedItems]);

    useEffect(() => {
        fetchMyCalendarData(currentDate);
    }, [currentDate, fetchMyCalendarData]);
    
    // ... UI rendering logic for MyCalendar ...
    return (
        <div>
            {/* Header, date pickers, etc. will go here */}
            <p className="text-sm text-text-secondary text-center mb-4">Your personalized calendar based on shows and movies in your lists.</p>
            {/* Calendar grid or list */}
        </div>
    );
};

// --- UPCOMING RELEASES VIEW ---
const UpcomingListView: React.FC<{
    fetcher: (page: number) => Promise<{ results: TmdbMedia[], total_pages: number }>;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    reminders: Reminder[];
    onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
    timezone: string;
}> = ({ fetcher, onSelectShow, reminders, onToggleReminder, timezone }) => {
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef(null);

    const loadMore = useCallback(async (isReset = false) => {
        if (loading || (!hasMore && !isReset)) return;
        setLoading(true);
        const currentPage = isReset ? 1 : page;
        try {
            const data = await fetcher(currentPage);

            const detailPromises = data.results.map(item => getMediaDetails(item.id, item.media_type).catch(() => null));
            const detailedResults = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => !!d);

            const newItems: CalendarItem[] = detailedResults.map(details => {
                let epInfo = 'Airing Soon';
                if (details.media_type === 'tv') {
                    const nextEp = details.next_episode_to_air;
                    if (nextEp) {
                        epInfo = `S${String(nextEp.season_number).padStart(2, '0')} E${String(nextEp.episode_number).padStart(2, '0')}: ${nextEp.name || 'TBA'}`;
                    } else {
                        epInfo = 'Series Premiere'; // Fallback
                    }
                } else {
                    epInfo = 'Movie Release';
                }

                return {
                    id: details.id,
                    media_type: details.media_type,
                    poster_path: details.poster_path,
                    still_path: details.next_episode_to_air?.still_path,
                    title: details.title || details.name || 'Untitled',
                    date: details.release_date || details.first_air_date || '',
                    episodeInfo: epInfo,
                    network: details.networks?.[0]?.name,
                    overview: details.overview,
                    runtime: details.runtime || details.episode_run_time?.[0],
                };
            });

            if (isReset) {
              setItems(newItems);
            } else {
              setItems(prev => [...prev, ...newItems]);
            }
            setPage(currentPage + 1);
            setHasMore(currentPage < data.total_pages);
        } catch (error) {
            console.error("Failed to load more items:", error);
        } finally {
            setLoading(false);
        }
    }, [page, loading, hasMore, fetcher]);
    
    useEffect(() => {
        loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetcher]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) loadMore(); },
            { rootMargin: "400px" }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => { if (currentLoader) observer.unobserve(currentLoader); };
    }, [loadMore]);

    return (
        <div className="space-y-4 mt-4">
            {items.map(item => {
                 const reminderId = `rem-${item.media_type}-${item.id}-${item.date}`;
                 return (
                    <CalendarListItem 
                        key={`${item.id}-${item.date}`}
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
                        isWatched={false}
                    />
                );
            })}
             <div ref={loaderRef} className="h-20 flex justify-center items-center">
                {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent"></div>}
                {!hasMore && items.length > 0 && <p className="text-text-secondary">You've reached the end.</p>}
            </div>
        </div>
    );
};

interface UpcomingSeasonsViewProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  timezone: string;
  allTrackedItems: TrackedItem[];
}

const UpcomingSeasonsView: React.FC<UpcomingSeasonsViewProps> = ({ onSelectShow, reminders, onToggleReminder, timezone, allTrackedItems }) => {
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const trackedShows = allTrackedItems.filter(i => i.media_type === 'tv');
                const detailPromises = trackedShows.map(show => getMediaDetails(show.id, 'tv').catch(() => null));
                const allDetails = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => !!d);

                const now = new Date();
                const upcomingSeasonItems: CalendarItem[] = [];

                allDetails.forEach(details => {
                    if (!details.seasons || details.status === 'Ended' || details.status === 'Canceled') return;

                    // Method 1: Check next_episode_to_air for a season premiere
                    if (details.next_episode_to_air && details.next_episode_to_air.episode_number === 1 && new Date(details.next_episode_to_air.air_date) >= now) {
                        const nextEp = details.next_episode_to_air;
                        upcomingSeasonItems.push({
                            id: details.id,
                            media_type: 'tv',
                            poster_path: nextEp.still_path || details.poster_path,
                            title: details.name || 'Untitled',
                            date: nextEp.air_date,
                            episodeInfo: `S${String(nextEp.season_number).padStart(2, '0')} E${String(nextEp.episode_number).padStart(2, '0')}: ${nextEp.name || 'TBA'}`,
                            network: details.networks?.[0]?.name,
                        });
                        return; // Found it for this show, move to next
                    }
                    
                    // Method 2: Check seasons array for future air dates if next_episode_to_air is not available
                    const lastAiredSeasonNum = details.last_episode_to_air?.season_number || 0;
                    const futureSeasons = details.seasons.filter(s => s.season_number > lastAiredSeasonNum && s.air_date && new Date(s.air_date) >= now);

                    if (futureSeasons.length > 0) {
                        const nextUpcomingSeason = futureSeasons.sort((a,b) => new Date(a.air_date).getTime() - new Date(b.air_date).getTime())[0];
                        upcomingSeasonItems.push({
                            id: details.id,
                            media_type: 'tv',
                            poster_path: nextUpcomingSeason.poster_path || details.poster_path,
                            title: details.name || 'Untitled',
                            date: nextUpcomingSeason.air_date,
                            episodeInfo: `${nextUpcomingSeason.name} Premiere`,
                            network: details.networks?.[0]?.name,
                        });
                    }
                });
                
                const uniqueItems = Array.from(new Map(upcomingSeasonItems.map(item => [`${item.id}-${item.date}`, item])).values());
                uniqueItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                setItems(uniqueItems);
            } catch (error) {
                console.error("Failed to load upcoming seasons:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [allTrackedItems]);

    if (loading) {
        return (
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent mx-auto"></div>
                <p className="mt-4 text-text-secondary">Scanning your shows for upcoming seasons...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return <div className="text-center py-10"><p className="text-text-secondary">No upcoming season premieres found in your tracked shows.</p></div>;
    }

    return (
        <div className="space-y-4 mt-4">
            {items.map(item => {
                const reminderId = `rem-${item.media_type}-${item.id}-${item.date}`;
                return (
                    <CalendarListItem 
                        key={`${item.id}-${item.date}`}
                        item={item}
                        onSelect={onSelectShow}
                        isPast={false} // These are all upcoming
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
                        onToggleWatched={() => {}} // Not applicable
                        isWatched={false} // Not applicable
                    />
                );
            })}
        </div>
    );
};


// --- MAIN CALENDAR SCREEN ---
const CalendarScreen: React.FC<CalendarScreenProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'my' | 'premieres' | 'seasons' | 'movies'>('my');

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-8">
      <header className="sticky top-0 bg-bg-primary/80 backdrop-blur-md z-20 pt-4 pb-2">
        <h1 className="text-3xl font-bold text-text-primary text-center w-full mb-4">Calendar</h1>
        <div className="flex justify-center">
            <div className="flex p-1 bg-bg-secondary rounded-full">
              <button onClick={() => setActiveTab('my')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'my' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>My Calendar</button>
              <button onClick={() => setActiveTab('premieres')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'premieres' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>TV Premieres</button>
              <button onClick={() => setActiveTab('seasons')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'seasons' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>Upcoming Seasons</button>
              <button onClick={() => setActiveTab('movies')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'movies' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>Movie Releases</button>
            </div>
        </div>
      </header>

      {activeTab === 'my' && <MyCalendarView {...props} />}
      {activeTab === 'premieres' && <UpcomingListView fetcher={getUpcomingTvPremieres} {...props} />}
      {activeTab === 'seasons' && <UpcomingSeasonsView {...props} />}
      {activeTab === 'movies' && <UpcomingListView fetcher={getUpcomingMovieReleases} {...props} />}
    </div>
  );
};

export default CalendarScreen;