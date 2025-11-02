
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserData, CalendarItem, Reminder, ReminderType, TmdbMedia, FullSeasonDrop, Episode, TraktToken, EpisodeWithAirtime, TvMazeScheduleItem } from '../types';
import { getMediaDetails, getCalendarMedia, getSeasonDetails } from '../services/tmdbService';
import * as traktService from '../services/traktService';
import { getScheduleByDate } from '../services/tvmazeService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TMDB_API_BASE_URL, TMDB_API_KEY } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '../components/Icons';
import { formatDate } from '../utils/formatUtils';
import MonthYearPicker from '../components/MonthYearPicker';
import CalendarListItem from '../components/CalendarListItem';
import FullSeasonDropItem from '../components/FullSeasonDropItem';
import Carousel from '../components/Carousel';

interface CalendarScreenProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
}

const DailyCalendarView: React.FC<{
    dateStr: string;
    items: (CalendarItem | FullSeasonDrop)[];
    reminders: Reminder[];
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
    timezone: string;
}> = ({ dateStr, items, reminders, onSelectShow, onToggleReminder, timezone }) => {
    
    // FIX: Explicitly cast the result of the filter to `CalendarItem[]` to resolve type errors.
    const movieItems = useMemo(() => items.filter(item => 'media_type' in item && item.media_type === 'movie') as CalendarItem[], [items]);
    const tvItems = useMemo(() => items.filter(item => ('media_type' in item && item.media_type === 'tv') || ('type' in item && item.type === 'full_season_drop')), [items]);
    
    const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');

    useEffect(() => {
        if (movieItems.length > 0) {
            setActiveTab('movies');
        } else if (tvItems.length > 0) {
            setActiveTab('tv');
        } else {
            setActiveTab('movies'); // default
        }
    }, [movieItems, tvItems]);

    const todayStr = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

    return (
        <div id={`date-${dateStr}`} className="scroll-mt-header">
            <h2 className={`text-lg font-bold sticky top-[68px] bg-bg-primary/80 backdrop-blur-sm py-2 z-10 ${dateStr === todayStr ? 'text-primary-accent' : 'text-text-primary'}`}>
                {formatDate(dateStr, timezone, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>

            {(movieItems.length > 0 || tvItems.length > 0) && (
                <div className="flex mb-3 border-b border-bg-secondary/50">
                    <button
                        onClick={() => setActiveTab('movies')}
                        className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'movies' ? 'text-primary-accent border-b-2 border-primary-accent' : 'text-text-secondary'}`}
                    >
                        Movie Releases ({movieItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('tv')}
                        className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'tv' ? 'text-primary-accent border-b-2 border-primary-accent' : 'text-text-secondary'}`}
                    >
                        TV Show Releases ({tvItems.length})
                    </button>
                </div>
            )}

            <div className="space-y-2">
                {activeTab === 'movies' && movieItems.map(item => {
                    const id = item.id;
                    const media_type = item.media_type;
                    const reminderId = `rem-${media_type}-${id}-${item.date}`;
                    const isPast = new Date(`${item.date}T23:59:59`) < new Date();
                    
                    return (
                        <CalendarListItem 
                            key={`${id}-${item.date}-${(item as CalendarItem).episodeInfo}`}
                            item={item as CalendarItem}
                            onSelect={onSelectShow}
                            isPast={isPast}
                            isReminderSet={reminders.some(r => r.id === reminderId)}
                            onToggleReminder={(type) => {
                                const newReminder: Reminder | null = type ? {
                                    id: reminderId, mediaId: id, mediaType: media_type,
                                    releaseDate: item.date, title: item.title, poster_path: item.poster_path,
                                    episodeInfo: (item as CalendarItem).episodeInfo, reminderType: type,
                                } : null;
                                onToggleReminder(newReminder, reminderId);
                            }}
                            timezone={timezone}
                        />
                    );
                })}
                {activeTab === 'tv' && tvItems.map(item => {
                    if ('type' in item && item.type === 'full_season_drop') {
                        const id = item.showId;
                        return <FullSeasonDropItem key={`${id}-${item.date}-${item.seasonNumber}`} item={item} onSelectShow={onSelectShow} />;
                    } else {
                        const id = (item as CalendarItem).id;
                        const media_type = (item as CalendarItem).media_type;
                        const reminderId = `rem-${media_type}-${id}-${item.date}`;
                        const isPast = new Date(`${item.date}T23:59:59`) < new Date();
                        
                        return (
                            <CalendarListItem 
                                key={`${id}-${item.date}-${(item as CalendarItem).episodeInfo}`}
                                item={item as CalendarItem}
                                onSelect={onSelectShow}
                                isPast={isPast}
                                isReminderSet={reminders.some(r => r.id === reminderId)}
                                onToggleReminder={(type) => {
                                    const newReminder: Reminder | null = type ? {
                                        id: reminderId, mediaId: id, mediaType: media_type,
                                        releaseDate: item.date, title: (item as CalendarItem).title, poster_path: (item as CalendarItem).poster_path,
                                        episodeInfo: (item as CalendarItem).episodeInfo, reminderType: type,
                                    } : null;
                                    onToggleReminder(newReminder, reminderId);
                                }}
                                timezone={timezone}
                            />
                        );
                    }
                })}
            </div>
            {activeTab === 'movies' && movieItems.length === 0 && (tvItems.length > 0) && <p className="text-sm text-text-secondary py-4">No movie releases for this day.</p>}
            {activeTab === 'tv' && tvItems.length === 0 && (movieItems.length > 0) && <p className="text-sm text-text-secondary py-4">No TV show releases for this day.</p>}
        </div>
    );
};

const CalendarScreen: React.FC<CalendarScreenProps> = ({ userData, onSelectShow, timezone, reminders, onToggleReminder }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [view, setView] = useState<'monthly' | 'daily'>('monthly');
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [items, setItems] = useState<Record<string, (CalendarItem | FullSeasonDrop)[]>>({});
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [traktToken] = useLocalStorage<TraktToken | null>('trakt_token', null);
  
  const formatDateForApi = (date: Date) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

  const fetchUserPersonalCalendar = useCallback(async (
    startDate: string, 
    endDate: string,
    tvmazeScheduleMap: Record<string, Record<number, TvMazeScheduleItem[]>>
  ): Promise<(CalendarItem | FullSeasonDrop)[]> => {
    let myCalendarData: (CalendarItem | FullSeasonDrop)[] = [];
    const trackedItems = [...userData.watching, ...userData.planToWatch, ...userData.completed];
    const uniqueItems = Array.from(new Map(trackedItems.map(item => [item.id, item])).values());
    
    const firstDayOfView = new Date(startDate + 'T00:00:00');
    const lastDayOfView = new Date(endDate + 'T23:59:59');

    for (const item of uniqueItems) {
        const details = await getMediaDetails(item.id, item.media_type).catch(() => null);
        if (!details) continue;

        if (item.media_type === 'movie') {
            const usRelease = details.release_dates?.results.find(r => r.iso_3166_1 === 'US');
            let releaseDateStr: string | undefined;

            if (usRelease) {
                // Find the earliest relevant release date in the US
                const theatrical = usRelease.release_dates.find(rd => rd.type === 3 || rd.type === 2);
                const digital = usRelease.release_dates.find(rd => rd.type === 4);
                const physical = usRelease.release_dates.find(rd => rd.type === 5);
                
                const releaseDate = theatrical?.release_date || digital?.release_date || physical?.release_date;
                if (releaseDate) {
                    releaseDateStr = releaseDate.split('T')[0];
                }
            } else if (details.origin_country?.includes('US')) {
                // If no specific US release object, but origin is US, use the primary date.
                releaseDateStr = details.release_date;
            }

            if (releaseDateStr && releaseDateStr >= startDate && releaseDateStr <= endDate) {
                myCalendarData.push({
                    id: details.id, media_type: 'movie', poster_path: details.poster_path, title: details.title || '',
                    date: releaseDateStr, episodeInfo: 'Movie Release', network: details.production_companies?.[0]?.name, overview: details.overview,
                });
            }
        } else if (item.media_type === 'tv' && details.seasons) {
            if (details.status === 'Ended' || details.status === 'Canceled') continue;

            for (const season of details.seasons) {
                if (season.season_number === 0 || !season.air_date) continue;
                
                const seasonAirDate = new Date(season.air_date);
                if (seasonAirDate > lastDayOfView) continue;
                
                const oneYearBeforeView = new Date(firstDayOfView);
                oneYearBeforeView.setFullYear(oneYearBeforeView.getFullYear() - 1);
                if (seasonAirDate < oneYearBeforeView) continue;
                
                const seasonDetails = await getSeasonDetails(item.id, season.season_number).catch(() => null);
                if (!seasonDetails || seasonDetails.episodes.length === 0) continue;

                const episodesByDate: Record<string, Episode[]> = {};
                seasonDetails.episodes.forEach(ep => {
                    if (ep.air_date && ep.air_date >= startDate && ep.air_date <= endDate) {
                        if (!episodesByDate[ep.air_date]) episodesByDate[ep.air_date] = [];
                        episodesByDate[ep.air_date].push(ep);
                    }
                });

                for (const date in episodesByDate) {
                    const dateEpisodes = episodesByDate[date];
                    const tvdbId = details.external_ids?.tvdb_id;
                    
                    if (dateEpisodes.length > 2) {
                        let enrichedEpisodes: EpisodeWithAirtime[] = dateEpisodes;
                        let firstEpisodeAirtime: string | undefined = undefined;
                        let network = details.networks?.[0]?.name;

                        if (tvdbId && tvmazeScheduleMap[date]?.[tvdbId]) {
                            const tvmazeShowInfo = tvmazeScheduleMap[date][tvdbId][0];
                            if(tvmazeShowInfo && !network) network = tvmazeShowInfo.show.network?.name;

                            enrichedEpisodes = dateEpisodes.map(ep => {
                                const tvmazeMatch = tvmazeScheduleMap[date][tvdbId].find(
                                mazeEp => mazeEp.season === ep.season_number && mazeEp.number === ep.episode_number
                                );
                                if (tvmazeMatch) return { ...ep, airtime: tvmazeMatch.airtime };
                                return ep;
                            });
                            firstEpisodeAirtime = enrichedEpisodes.find(ep => ep.airtime)?.airtime;
                        }

                        myCalendarData.push({
                            type: 'full_season_drop', showId: item.id, showTitle: item.title, seasonNumber: season.season_number,
                            seasonName: season.name, poster_path: season.poster_path || details.poster_path, date: date,
                            airtime: firstEpisodeAirtime, network, episodes: enrichedEpisodes.sort((a, b) => a.episode_number - b.episode_number),
                        });
                    } else {
                        dateEpisodes.forEach(ep => {
                            let airtime: string | undefined;
                            let runtime = ep.runtime;
                            let network = details.networks?.[0]?.name;

                            if (tvdbId && tvmazeScheduleMap[ep.air_date]?.[tvdbId]) {
                                const tvmazeMatch = tvmazeScheduleMap[ep.air_date][tvdbId].find(
                                    mazeEp => mazeEp.season === ep.season_number && mazeEp.number === ep.episode_number
                                );
                                if (tvmazeMatch) {
                                    airtime = tvmazeMatch.airtime;
                                    if (!runtime) runtime = tvmazeMatch.runtime;
                                    if (!network) network = tvmazeMatch.show.network?.name;
                                }
                            }

                            myCalendarData.push({
                                id: item.id, media_type: 'tv', poster_path: item.poster_path, still_path: ep.still_path,
                                title: item.title, date: ep.air_date, episodeInfo: `S${ep.season_number} E${ep.episode_number}: ${ep.name}`,
                                airtime, network, overview: ep.overview, runtime,
                            });
                        });
                    }
                }
            }
        }
    }
    return myCalendarData;
  }, [userData]);

  const fetchAllPremieres = useCallback(async (startDate: string, endDate: string): Promise<CalendarItem[]> => {
      let premiereData: CalendarItem[] = [];
      const movieUrl = `${TMDB_API_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&sort_by=popularity.desc&region=US`;
      const tvUrl = `${TMDB_API_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date.gte=${startDate}&first_air_date.lte=${endDate}&sort_by=popularity.desc&with_origin_country=US`;

      const [movieRes, tvRes] = await Promise.all([ fetch(movieUrl).then(res => res.json()), fetch(tvUrl).then(res => res.json()), ]);
      const movies: TmdbMedia[] = movieRes.results.map((item: any) => ({ ...item, media_type: 'movie' }));
      const tvs: TmdbMedia[] = tvRes.results.map((item: any) => ({ ...item, media_type: 'tv' }));

      movies.forEach(item => { if (item.release_date) { premiereData.push({ id: item.id, media_type: 'movie', poster_path: item.poster_path, title: item.title || '', date: item.release_date, episodeInfo: 'Movie Release', overview: item.overview }); } });
      tvs.forEach(item => { if (item.first_air_date) { premiereData.push({ id: item.id, media_type: 'tv', poster_path: item.poster_path, title: item.name || '', date: item.first_air_date, episodeInfo: 'Series Premiere', overview: item.overview }); } });

      return premiereData;
  }, []);

  const fetchTraktCalendar = useCallback(async (startDate: string, days: number): Promise<(CalendarItem | FullSeasonDrop)[]> => {
    if (!traktToken) return [];
    
    let calendarData: CalendarItem[] = [];

    const [myShows, myMovies, allShowPremieres, allMovieReleases] = await Promise.all([
        activeTab === 'my' ? traktService.getMyCalendarShows(traktToken, startDate, days) : Promise.resolve([]),
        activeTab === 'my' ? traktService.getMyCalendarMovies(traktToken, startDate, days) : Promise.resolve([]),
        activeTab === 'all' ? traktService.getAllCalendarShows(traktToken, startDate, days) : Promise.resolve([]),
        activeTab === 'all' ? traktService.getAllCalendarMovies(traktToken, startDate, days) : Promise.resolve([]),
    ]).catch(err => {
        console.error("Failed to fetch Trakt calendar data", err);
        return [[], [], [], []];
    });

    const shows = activeTab === 'my' ? myShows : allShowPremieres;
    const movies = activeTab === 'my' ? myMovies : allMovieReleases;

    const showItems: CalendarItem[] = shows.map(item => ({
        id: item.show.ids.tmdb,
        media_type: 'tv',
        poster_path: null,
        title: item.show.title,
        date: item.first_aired.split('T')[0],
        episodeInfo: `S${item.episode.season} E${item.episode.number}: ${item.episode.title}`,
    }));
    
    const movieItems: CalendarItem[] = movies.map(item => ({
        id: item.movie.ids.tmdb,
        media_type: 'movie',
        poster_path: null,
        title: item.movie.title,
        date: item.released,
        episodeInfo: 'Movie Release',
    }));

    calendarData = [...showItems, ...movieItems];
    
    const uniqueIds = new Map<string, {id: number, media_type: 'tv' | 'movie'}>();
    calendarData.forEach(item => uniqueIds.set(`${item.media_type}-${item.id}`, {id: item.id, media_type: item.media_type}));
    
    const detailsPromises = Array.from(uniqueIds.values()).map(item => getMediaDetails(item.id, item.media_type).catch(() => null));
    const detailsResults = await Promise.all(detailsPromises);
    const detailsMap = new Map(detailsResults.filter(d => d).map(d => [d!.id, d]));

    return calendarData.map(item => {
        const details = detailsMap.get(item.id);
        return {
            ...item,
            poster_path: details?.poster_path || null,
            overview: details?.overview || item.overview,
            network: details?.networks?.[0]?.name || item.network,
        };
    });
  }, [traktToken, activeTab]);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      
      let startDate: string;
      let endDate: string;
      let daysInPeriod: number;

      if (view === 'monthly') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        daysInPeriod = lastDayOfMonth.getDate();
        startDate = formatDateForApi(firstDayOfMonth);
        endDate = formatDateForApi(lastDayOfMonth);
      } else { // daily
        daysInPeriod = 1;
        startDate = formatDateForApi(selectedDay);
        endDate = startDate;
      }
      
      let tvmazeScheduleMap: Record<string, Record<number, TvMazeScheduleItem[]>> = {};
      if (!traktToken) {
        try {
          const tvmazePromises: Promise<void>[] = [];
          if (view === 'monthly') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateStr = formatDateForApi(date);
                tvmazePromises.push(getScheduleByDate('US', dateStr).then(daySchedule => {
                  if (daySchedule.length > 0) tvmazeScheduleMap[dateStr] = {};
                  daySchedule.forEach(item => {
                    if (item.show.externals.thetvdb) {
                      const tvdbId = item.show.externals.thetvdb;
                      if (!tvmazeScheduleMap[dateStr][tvdbId]) tvmazeScheduleMap[dateStr][tvdbId] = [];
                      tvmazeScheduleMap[dateStr][tvdbId].push(item);
                    }
                  });
                }));
            }
          } else { // daily
            const dateStr = formatDateForApi(selectedDay);
            tvmazePromises.push(getScheduleByDate('US', dateStr).then(daySchedule => {
                if (daySchedule.length > 0) tvmazeScheduleMap[dateStr] = {};
                daySchedule.forEach(item => {
                    if (item.show.externals.thetvdb) {
                        const tvdbId = item.show.externals.thetvdb;
                        if (!tvmazeScheduleMap[dateStr][tvdbId]) tvmazeScheduleMap[dateStr][tvdbId] = [];
                        tvmazeScheduleMap[dateStr][tvdbId].push(item);
                    }
                });
            }));
          }
          await Promise.all(tvmazePromises);
        } catch (e) {
          console.error("Failed to fetch TVMaze schedule data, calendar will have limited details.", e);
        }
      }

      let calendarData: (CalendarItem | FullSeasonDrop)[] = [];

      if (traktToken) {
          calendarData = await fetchTraktCalendar(startDate, daysInPeriod);
      } else if (activeTab === 'my') {
          calendarData = await fetchUserPersonalCalendar(startDate, endDate, tvmazeScheduleMap);
      } else { // 'all' tab without trakt
          const [myItems, premiereItems] = await Promise.all([
              fetchUserPersonalCalendar(startDate, endDate, tvmazeScheduleMap),
              fetchAllPremieres(startDate, endDate)
          ]);
          calendarData = [...myItems, ...premiereItems];
      }

      const uniqueItems = new Map<string, CalendarItem | FullSeasonDrop>();
      calendarData.forEach(item => {
          const id = 'type' in item ? item.showId : item.id;
          const episodeInfo = 'type' in item ? item.seasonName : item.episodeInfo;
          const key = `${id}-${item.date}-${episodeInfo}`;
          if (!uniqueItems.has(key)) {
              uniqueItems.set(key, item);
          }
      });
      const finalData = Array.from(uniqueItems.values());

      const itemsByDate: Record<string, (CalendarItem | FullSeasonDrop)[]> = {};
      finalData.forEach(item => {
        const dateKey = item.date;
        if (!itemsByDate[dateKey]) itemsByDate[dateKey] = [];
        itemsByDate[dateKey].push(item);
      });
      
      setItems(itemsByDate);
      setLoading(false);
    };
    fetchCalendarData();
  }, [currentDate, selectedDay, view, activeTab, fetchUserPersonalCalendar, fetchAllPremieres, traktToken, fetchTraktCalendar]);

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };
  
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const sortedDates = useMemo(() => Object.keys(items).sort((a,b) => new Date(a).getTime() - new Date(b).getTime()), [items]);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
      <MonthYearPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} currentDate={currentDate} onDateChange={setCurrentDate} />
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Calendar</h1>
        {traktToken && <p className="text-xs text-green-400 -mt-3 mb-4">Powered by Trakt.tv</p>}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="flex p-1 bg-bg-secondary rounded-full">
                <button onClick={() => setActiveTab('my')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'my' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>My Calendar</button>
                <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'all' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>All Upcoming</button>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex p-1 bg-bg-secondary rounded-full">
                    <button onClick={() => setView('monthly')} className={`px-3 py-1 text-sm font-semibold rounded-full ${view === 'monthly' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>Monthly</button>
                    <button onClick={() => setView('daily')} className={`px-3 py-1 text-sm font-semibold rounded-full ${view === 'daily' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>Daily</button>
                </div>
                {view === 'monthly' ? (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-bg-secondary"><ChevronLeftIcon className="w-6 h-6"/></button>
                        <button onClick={() => setIsPickerOpen(true)} className="font-semibold text-lg w-40 text-center flex items-center justify-center hover:bg-bg-secondary p-1 rounded-md">
                            <span>{monthName}</span>
                            <ChevronDownIcon className="w-4 h-4 ml-1"/>
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-bg-secondary"><ChevronRightIcon className="w-6 h-6"/></button>
                    </div>
                ) : (
                    <input
                        type="date"
                        value={formatDateForApi(selectedDay)}
                        onChange={e => setSelectedDay(new Date(e.target.value + 'T00:00:00'))}
                        className="bg-bg-secondary text-text-primary rounded-md p-2 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                )}
            </div>
        </div>
      </header>
      
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-6 w-1/3 bg-bg-secondary rounded-md mb-2"></div>
                <div className="h-24 bg-bg-secondary rounded-lg"></div>
              </div>
          ))}
        </div>
      ) : sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map(dateStr => (
            <DailyCalendarView 
              key={dateStr}
              dateStr={dateStr}
              items={items[dateStr] || []}
              reminders={reminders}
              onSelectShow={onSelectShow}
              onToggleReminder={onToggleReminder}
              timezone={timezone}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-bg-secondary/30 rounded-lg">
          <h2 className="text-xl font-bold">
            {view === 'daily' ? 'Nothing Scheduled for this Day' : 'Nothing Scheduled for this Month'}
          </h2>
          <p className="mt-2 text-text-secondary">No releases found for this period.</p>
        </div>
      )}
    </div>
  );
};

export default CalendarScreen;
