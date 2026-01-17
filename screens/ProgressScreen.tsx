import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserData, WatchStatus, TrackedItem, FavoriteEpisodes, TmdbMediaDetails, Episode, WatchProgress, HistoryItem, LiveWatchMediaInfo, EpisodeProgress } from '../types';
import { getMediaDetails, getSeasonDetails, clearMediaCache } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { StarIcon, ChevronDownIcon, ArrowPathIcon, ClockIcon, TvIcon, ChartBarIcon, PlayIcon, SearchIcon, FilmIcon, ListBulletIcon, SparklesIcon, CheckCircleIcon } from '../components/Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ProgressCard, { EnrichedShowData } from '../components/ProgressCard';
import ProgressMovieCard, { EnrichedMovieData } from '../components/ProgressMovieCard';

// --- TYPE DEFINITIONS ---
type EnrichedMediaData = (EnrichedShowData | EnrichedMovieData);

type SortOption = 'lastWatched' | 'staleFirst' | 'mostEpisodesLeft' | 'leastEpisodesLeft' | 'popularity' | 'recentlyAired';
type TypeFilter = 'all' | 'tv' | 'movie' | 'episode' | 'season';

// --- Granular Component: Episode View Card ---
const EpisodeProgressCard: React.FC<{ 
    show: EnrichedShowData; 
    onSelect: () => void;
    onToggleWatched: (e: React.MouseEvent) => void;
}> = ({ show, onSelect, onToggleWatched }) => {
    const ep = show.nextEpisodeInfo;
    if (!ep) return null;
    
    return (
        <div 
            onClick={onSelect}
            className="group flex gap-4 p-3 bg-bg-secondary/30 rounded-2xl border border-white/5 hover:border-primary-accent/30 transition-all cursor-pointer shadow-lg overflow-hidden relative"
        >
            <div className="w-32 h-20 flex-shrink-0 relative rounded-xl overflow-hidden shadow-md">
                <img 
                    src={getImageUrl(ep.still_path || show.poster_path, 'w300', ep.still_path ? 'still' : 'poster')} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
            </div>
            <div className="flex-grow min-w-0 flex flex-col justify-center">
                <p className="text-[9px] font-black text-primary-accent uppercase tracking-[0.2em] mb-0.5 truncate">{show.title}</p>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight truncate">
                    S{ep.season_number} E{ep.episode_number}: {ep.name}
                </h3>
                <p className="text-[10px] text-text-secondary mt-1 font-bold opacity-60">
                    {ep.air_date ? new Date(ep.air_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                </p>
            </div>
            <button 
                onClick={onToggleWatched}
                className="self-center p-3 rounded-full bg-bg-secondary/50 text-text-secondary hover:text-green-400 hover:bg-green-400/10 transition-all border border-white/5"
            >
                <CheckCircleIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// --- Granular Component: Season View Card ---
const SeasonProgressCard: React.FC<{ 
    show: EnrichedShowData; 
    onSelect: () => void;
}> = ({ show, onSelect }) => {
    const progress = show.totalEpisodes > 0 ? (show.watchedCount / show.totalEpisodes) * 100 : 0;
    
    return (
        <div 
            onClick={onSelect}
            className="group p-4 bg-bg-secondary/30 rounded-3xl border border-white/5 hover:border-primary-accent/30 transition-all cursor-pointer shadow-lg"
        >
            <div className="flex justify-between items-center mb-3">
                <div className="min-w-0 flex-grow">
                    <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter truncate">{show.title}</h3>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-60">
                        Season {show.nextEpisodeInfo?.season_number || 1} Progress
                    </p>
                </div>
                <div className="text-right ml-4">
                    <span className="text-lg font-black text-primary-accent leading-none">{Math.round(progress)}%</span>
                </div>
            </div>
            <div className="w-full bg-bg-primary rounded-full h-2 overflow-hidden border border-white/5">
                <div 
                    className="bg-accent-gradient h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between mt-2 text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-40">
                <span>{show.watchedCount} Watched</span>
                <span>{show.totalEpisodes - show.watchedCount} Remaining</span>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const QuickStat: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-bg-secondary/50 p-3 rounded-2xl flex items-center space-x-3 border border-white/5">
        <div className="text-primary-accent">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-text-primary leading-none">{value}</p>
        </div>
    </div>
);

const FilterButton: React.FC<{ label: string; active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ label, active, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all type-box-filter ${
            active 
            ? 'bg-accent-gradient text-on-accent shadow-lg scale-105 border-transparent' 
            : 'bg-bg-secondary text-text-primary/70'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

// --- MAIN SCREEN COMPONENT ---

interface User {
  id: string;
  username: string;
  email: string;
}

interface ProgressScreenProps {
  userData: UserData;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  currentUser: User | null;
  onAuthClick: () => void;
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
}

const ProgressScreen: React.FC<ProgressScreenProps> = (props) => {
    const { userData, favoriteEpisodes, currentUser, onAuthClick, pausedLiveSessions, onStartLiveWatch } = props;
    const { watching, onHold, watchProgress, history } = userData;
    
    const [sortOption, setSortOption] = useState<SortOption>('lastWatched');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [enrichedMedia, setEnrichedMedia] = useState<EnrichedMediaData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useLocalStorage<number>('progress_last_refreshed', 0);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = useCallback(() => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        [...watching, ...onHold].filter(item => item.media_type === 'tv').forEach(show => clearMediaCache(show.id, 'tv'));
        (Object.values(pausedLiveSessions) as { mediaInfo: LiveWatchMediaInfo }[]).forEach(session => clearMediaCache(session.mediaInfo.id, 'movie'));
        setLastRefreshed(Date.now());
        setRefreshKey(prev => prev + 1);
    }, [isRefreshing, watching, onHold, pausedLiveSessions, setLastRefreshed]);

    useEffect(() => {
        const now = Date.now();
        const sixHours = 6 * 60 * 60 * 1000;
        if (now - lastRefreshed > sixHours) {
            handleRefresh();
        } else {
            setRefreshKey(prev => prev + 1);
        }
    }, []);

    useEffect(() => {
        const processMedia = async () => {
            if (!isRefreshing) setIsLoading(true);

            const itemsToProcess = [...watching, ...onHold];
            const watchingIds = new Set(watching.map(i => i.id));
            const showsToProcess = itemsToProcess.filter(item => item.media_type === 'tv');

            const pausedMoviesInfo = (Object.values(pausedLiveSessions) as { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }[])
                .filter(s => s.mediaInfo.media_type === 'movie')
                .map(s => s.mediaInfo);

            if (showsToProcess.length === 0 && pausedMoviesInfo.length === 0) {
                setEnrichedMedia([]);
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            const batchSize = 10;
            const showDetailsResults: (TmdbMediaDetails | null)[] = [];
            for (let i = 0; i < showsToProcess.length; i += batchSize) {
                const batch = showsToProcess.slice(i, i + batchSize);
                const batchPromises = batch.map(item => getMediaDetails(item.id, 'tv').catch(() => null));
                showDetailsResults.push(...await Promise.all(batchPromises));
            }

            const movieDetailsResults: (TmdbMediaDetails | null)[] = [];
            for (let i = 0; i < pausedMoviesInfo.length; i += batchSize) {
                const batch = pausedMoviesInfo.slice(i, i + batchSize);
                const batchPromises = batch.map(item => getMediaDetails(item.id, 'movie').catch(() => null));
                movieDetailsResults.push(...await Promise.all(batchPromises));
            }

            const enrichedShowDataPromises = showDetailsResults.map(async (details, index) => {
                if (!details || !details.seasons) return null;
                const item = showsToProcess[index];
                
                const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);
                const totalEpisodes = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);
                const progressForShow = watchProgress[item.id] || {};
                let watchedCount = 0;
                let completedSeasons = 0;

                seasonsForCalc.forEach(s => { 
                    let seasonWatched = 0;
                    for (let i = 1; i <= s.episode_count; i++) {
                        if (progressForShow[s.season_number]?.[i]?.status === 2) {
                            watchedCount++;
                            seasonWatched++;
                        }
                    }
                    if (s.episode_count > 0 && seasonWatched >= s.episode_count) {
                        completedSeasons++;
                    }
                });
                
                if (totalEpisodes > 0 && watchedCount >= totalEpisodes) {
                    if (watchingIds.has(item.id)) {
                        props.onUpdateLists(item, 'watching', 'completed');
                    }
                    return null;
                }

                let nextEpisodeInfo: Episode | null = null;
                const sortedSeasons = [...seasonsForCalc].sort((a,b) => a.season_number - b.season_number);
                const today = new Date().toISOString().split('T')[0];

                for (const season of sortedSeasons) {
                    const seasonDetails = await getSeasonDetails(details.id, season.season_number).catch(() => null);
                    if (!seasonDetails) continue;

                    for (const ep of seasonDetails.episodes) {
                        const hasAired = ep.air_date && ep.air_date <= today;
                        const isWatched = progressForShow[ep.season_number]?.[ep.episode_number]?.status === 2;
                        if (hasAired && !isWatched) {
                            nextEpisodeInfo = ep;
                            break;
                        }
                    }
                    if (nextEpisodeInfo) break;
                }
                
                const showHistory = history.filter(h => h.id === item.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                const lastWatchedTimestamp = showHistory.length > 0 ? new Date(showHistory[0].timestamp).getTime() : 0;
                const isPaused = !!pausedLiveSessions[item.id];
                
                if (nextEpisodeInfo) {
                    return {
                        ...item, details, nextEpisodeInfo, watchedCount, totalEpisodes, lastWatchedTimestamp,
                        popularity: details.popularity || 0,
                        status: watchingIds.has(item.id) ? 'watching' : 'onHold',
                        completedSeasons,
                        isPaused
                    };
                }
                return null;
            });
            
            const finalEnrichedShows = (await Promise.all(enrichedShowDataPromises)).filter((item): item is EnrichedShowData => item !== null);
            
            const finalEnrichedMovies: EnrichedMovieData[] = movieDetailsResults.map((details, index) => {
                if (!details) return null;
                const item = pausedMoviesInfo[index];
                const pausedSession = pausedLiveSessions[item.id];
                const trackedItem: TrackedItem = { id: item.id, title: details.title || details.name || 'Untitled', media_type: 'movie', poster_path: details.poster_path, genre_ids: details.genres?.map(g => g.id) };

                return { ...trackedItem, details, elapsedSeconds: pausedSession.elapsedSeconds, lastWatchedTimestamp: new Date(pausedSession.pausedAt).getTime(), popularity: details.popularity || 0, status: 'onHold' };
            }).filter((item): item is EnrichedMovieData => item !== null);

            setEnrichedMedia([...finalEnrichedShows, ...finalEnrichedMovies]);
            setIsLoading(false);
            setIsRefreshing(false);
        };

        if (refreshKey > 0) processMedia();
    }, [watchProgress, history, refreshKey, pausedLiveSessions, watching, onHold, props.onUpdateLists, isRefreshing]);

    const sortedMedia = useMemo(() => {
        let results = enrichedMedia.filter(item => {
            if (item.media_type === 'tv') return (item as EnrichedShowData).nextEpisodeInfo !== null;
            return true;
        });

        // 1. Apply Type Filter
        if (typeFilter === 'tv') {
            results = results.filter(i => i.media_type === 'tv');
        } else if (typeFilter === 'movie') {
            results = results.filter(i => i.media_type === 'movie');
        } else if (typeFilter === 'episode') {
            results = results.filter(i => i.media_type === 'tv');
        } else if (typeFilter === 'season') {
            results = results.filter(i => i.media_type === 'tv');
        }

        // 2. Apply Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(item => item.title.toLowerCase().includes(query));
        }

        // 3. Sort function
        const sortFunction = (a: EnrichedMediaData, b: EnrichedMediaData): number => {
            switch (sortOption) {
                case 'leastEpisodesLeft':
                    const remainingA = a.media_type === 'tv' ? (a as EnrichedShowData).totalEpisodes - (a as EnrichedShowData).watchedCount : 1;
                    const remainingB = b.media_type === 'tv' ? (b as EnrichedShowData).totalEpisodes - (b as EnrichedShowData).watchedCount : 1;
                    return remainingA - remainingB;
                case 'mostEpisodesLeft':
                    const remainingA2 = a.media_type === 'tv' ? (a as EnrichedShowData).totalEpisodes - (a as EnrichedShowData).watchedCount : 1;
                    const remainingB2 = b.media_type === 'tv' ? (b as EnrichedShowData).totalEpisodes - (b as EnrichedShowData).watchedCount : 1;
                    return remainingB2 - remainingA2;
                case 'staleFirst':
                    const timeA = a.lastWatchedTimestamp === 0 ? Infinity : a.lastWatchedTimestamp;
                    const timeB = b.lastWatchedTimestamp === 0 ? Infinity : b.lastWatchedTimestamp;
                    return timeA - timeB;
                case 'popularity':
                    return (b.popularity || 0) - (a.popularity || 0);
                case 'recentlyAired':
                    const airA = a.media_type === 'tv' ? new Date((a as EnrichedShowData).nextEpisodeInfo?.air_date || 0).getTime() : 0;
                    const airB = b.media_type === 'tv' ? new Date((b as EnrichedShowData).nextEpisodeInfo?.air_date || 0).getTime() : 0;
                    return airB - airA;
                case 'lastWatched':
                default:
                    return b.lastWatchedTimestamp - a.lastWatchedTimestamp;
            }
        };

        // Standard grouping for All/Shows/Movies
        if (typeFilter !== 'episode' && typeFilter !== 'season') {
            const watchingItems = results.filter(item => (item as EnrichedShowData).status === 'watching');
            const onHoldItems = results.filter(item => (item as EnrichedShowData).status === 'onHold');
            watchingItems.sort(sortFunction);
            onHoldItems.sort(sortFunction);
            return [...watchingItems, ...onHoldItems];
        } else {
            // For Episodes/Seasons view, don't group by status as strictly, just sort
            return results.sort(sortFunction);
        }
    }, [enrichedMedia, sortOption, searchQuery, typeFilter]);
    
    const quickStats = useMemo(() => {
        let episodesLeft = 0, hoursLeft = 0, showsInProgress = 0, moviesInProgress = 0;
        enrichedMedia.forEach(item => {
            if (item.media_type === 'tv') {
                const show = item as EnrichedShowData;
                if (show.nextEpisodeInfo) {
                    const remaining = show.totalEpisodes - show.watchedCount;
                    episodesLeft += remaining;
                    hoursLeft += remaining * 45;
                    showsInProgress++;
                }
            } else {
                const movie = item as EnrichedMovieData;
                const remainingSeconds = (movie.details.runtime || 0) * 60 - movie.elapsedSeconds;
                hoursLeft += remainingSeconds / 60;
                moviesInProgress++;
            }
        });
        return {
            itemsInProgress: showsInProgress + moviesInProgress,
            episodesToWatch: episodesLeft,
            hoursToWatch: Math.round(hoursLeft / 60),
        };
    }, [enrichedMedia]);
    
    return (
        <div className="animate-fade-in space-y-8 max-w-7xl mx-auto px-4 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Progress</h1>
                    <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.2em] mt-1 opacity-60">Mapping your incomplete journeys</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <QuickStat label="Active" value={quickStats.itemsInProgress} icon={<TvIcon className="w-5 h-5"/>} />
                    <QuickStat label="Episodes" value={quickStats.episodesToWatch} icon={<ChartBarIcon className="w-5 h-5"/>} />
                    <QuickStat label="Hours" value={`${quickStats.hoursToWatch}h`} icon={<ClockIcon className="w-5 h-5"/>} />
                </div>
            </header>

            <section className="space-y-6">
                <div className="flex flex-col space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <FilterButton label="All" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} icon={<ListBulletIcon className="w-4 h-4"/>} />
                        <FilterButton label="Shows" active={typeFilter === 'tv'} onClick={() => setTypeFilter('tv')} icon={<TvIcon className="w-4 h-4"/>} />
                        <FilterButton label="Movies" active={typeFilter === 'movie'} onClick={() => setTypeFilter('movie')} icon={<FilmIcon className="w-4 h-4"/>} />
                        <FilterButton label="Episodes" active={typeFilter === 'episode'} onClick={() => setTypeFilter('episode')} icon={<PlayIcon className="w-4 h-4"/>} />
                        <FilterButton label="Seasons" active={typeFilter === 'season'} onClick={() => setTypeFilter('season')} icon={<ChartBarIcon className="w-4 h-4"/>} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-grow w-full">
                            <input
                                type="text"
                                placeholder="Search progress..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 font-semibold shadow-inner"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-grow sm:min-w-[200px]">
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                                    className="w-full appearance-none rounded-2xl py-3 pl-4 pr-10 text-xs font-black uppercase tracking-widest focus:outline-none shadow-inner"
                                >
                                    <option value="lastWatched">Recently Active</option>
                                    <option value="staleFirst">Stale First</option>
                                    <option value="recentlyAired">Recently Aired</option>
                                    <option value="popularity">Trending</option>
                                    <option value="leastEpisodesLeft">Least Left</option>
                                    <option value="mostEpisodesLeft">Most Left</option>
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                            </div>
                            <button 
                                onClick={handleRefresh} 
                                disabled={isRefreshing || isLoading} 
                                className="p-3 bg-bg-secondary/40 rounded-2xl text-text-primary hover:brightness-125 disabled:opacity-50 border border-white/5 shadow-inner group" 
                                aria-label="Refresh Data"
                            >
                                <ArrowPathIcon className={`h-5 w-5 group-hover:text-primary-accent transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-bg-secondary/20 rounded-3xl animate-pulse h-48 border border-white/5"></div>)}
                    </div>
                ) : sortedMedia.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {sortedMedia.map(item => {
                            if (typeFilter === 'episode' && item.media_type === 'tv') {
                                const show = item as EnrichedShowData;
                                return (
                                    <div key={item.id} className="animate-slide-in-up">
                                        <EpisodeProgressCard 
                                            show={show} 
                                            onSelect={() => props.onSelectShow(item.id, 'tv')}
                                            onToggleWatched={(e) => {
                                                e.stopPropagation();
                                                if (show.nextEpisodeInfo) {
                                                    props.onToggleEpisode(show.id, show.nextEpisodeInfo.season_number, show.nextEpisodeInfo.episode_number, 0, show, show.nextEpisodeInfo.name);
                                                }
                                            }}
                                        />
                                    </div>
                                );
                            }

                            if (typeFilter === 'season' && item.media_type === 'tv') {
                                return (
                                    <div key={item.id} className="animate-slide-in-up">
                                        <SeasonProgressCard 
                                            show={item as EnrichedShowData} 
                                            onSelect={() => props.onSelectShow(item.id, 'tv')}
                                        />
                                    </div>
                                );
                            }

                            if (item.media_type === 'tv') {
                                const showItem = item as EnrichedShowData;
                                const nextEp = showItem.nextEpisodeInfo;
                                const isFav = nextEp ? (favoriteEpisodes[item.id]?.[nextEp.season_number]?.[nextEp.episode_number] || false) : false;
                                return (
                                    <div key={item.id} className="animate-slide-in-up">
                                        <ProgressCard item={showItem} {...props} isEpisodeFavorited={isFav} />
                                    </div>
                                );
                            } else {
                                const movieItem = item as EnrichedMovieData;
                                return (
                                    <div key={item.id} className="animate-slide-in-up">
                                        <ProgressMovieCard item={movieItem} onSelectShow={props.onSelectShow} onStartLiveWatch={onStartLiveWatch} />
                                    </div>
                                );
                            }
                        })}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5 flex flex-col items-center">
                        <SparklesIcon className="w-16 h-16 text-text-secondary/20 mb-4" />
                        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">
                            {searchQuery ? "No Matches Found" : "All Clear"}
                        </h2>
                        <p className="mt-2 text-text-secondary font-medium px-10 max-w-md mx-auto">
                            {searchQuery 
                                ? `We couldn't find any items in your progress matching "${searchQuery}".` 
                                : "You've successfully finished all items you were tracking. Start something new from search or discovery!"}
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProgressScreen;