import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { UserData, WatchStatus, TrackedItem, FavoriteEpisodes, TmdbMediaDetails, Episode, WatchProgress, HistoryItem, LiveWatchMediaInfo } from '../types';
import { getMediaDetails, getSeasonDetails, clearMediaCache } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { StarIcon, ChevronDownIcon, ArrowPathIcon, ClockIcon, TvIcon, ChartBarIcon, PlayIcon } from '../components/Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ProgressCard, { EnrichedShowData } from '../components/ProgressCard';
import ProgressMovieCard, { EnrichedMovieData } from '../components/ProgressMovieCard';

// --- TYPE DEFINITIONS ---
type EnrichedMediaData = (EnrichedShowData | EnrichedMovieData);

type SortOption = 'lastWatched' | 'oldestWatched' | 'mostEpisodesLeft' | 'leastEpisodesLeft' | 'popularity';

// --- HELPER COMPONENTS ---

const QuickStat: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-bg-secondary/50 p-3 rounded-lg flex items-center space-x-3">
        <div className="text-primary-accent">{icon}</div>
        <div>
            <p className="text-xs text-text-secondary">{label}</p>
            <p className="text-xl font-bold text-text-primary">{value}</p>
        </div>
    </div>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            const showDetailsPromises = showsToProcess.map(item => getMediaDetails(item.id, 'tv').catch(() => null));
            const movieDetailsPromises = pausedMoviesInfo.map(item => getMediaDetails(item.id, 'movie').catch(() => null));
            const [showDetailsResults, movieDetailsResults] = await Promise.all([
                Promise.all(showDetailsPromises),
                Promise.all(movieDetailsPromises)
            ]);

            const enrichedShowDataPromises = showDetailsResults.map(async (details, index) => {
                if (!details || !details.seasons) return null;
                const item = showsToProcess[index];
                
                const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);
                const totalEpisodes = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);
                const progressForShow = watchProgress[item.id] || {};
                let watchedCount = 0;
                seasonsForCalc.forEach(s => { for (let i = 1; i <= s.episode_count; i++) if (progressForShow[s.season_number]?.[i]?.status === 2) watchedCount++; });
                
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
                
                if (nextEpisodeInfo) {
                    return {
                        ...item, details, nextEpisodeInfo, watchedCount, totalEpisodes, lastWatchedTimestamp,
                        popularity: details.popularity || 0,
                        status: watchingIds.has(item.id) ? 'watching' : 'onHold',
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
    }, [watchProgress, history, refreshKey, pausedLiveSessions, watching, onHold, props.onUpdateLists]);

    const sortedMedia = useMemo(() => {
        const displayableMedia = enrichedMedia.filter(item => {
            if (item.media_type === 'tv') return (item as EnrichedShowData).nextEpisodeInfo !== null;
            return true;
        });

        const watchingItems = displayableMedia.filter(item => (item as EnrichedShowData).status === 'watching');
        const onHoldItems = displayableMedia.filter(item => (item as EnrichedShowData).status === 'onHold');
        
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
                case 'oldestWatched':
                    const timeA = a.lastWatchedTimestamp === 0 ? Infinity : a.lastWatchedTimestamp;
                    const timeB = b.lastWatchedTimestamp === 0 ? Infinity : b.lastWatchedTimestamp;
                    return timeA - timeB;
                case 'popularity':
                    return (b.popularity || 0) - (a.popularity || 0);
                case 'lastWatched':
                default:
                    return b.lastWatchedTimestamp - a.lastWatchedTimestamp;
            }
        };

        watchingItems.sort(sortFunction);
        onHoldItems.sort(sortFunction);

        return [...watchingItems, ...onHoldItems];
    }, [enrichedMedia, sortOption]);
    
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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary">Progress</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <QuickStat label="Items in Progress" value={quickStats.itemsInProgress} icon={<TvIcon className="w-6 h-6"/>} />
                <QuickStat label="Episodes to Watch" value={quickStats.episodesToWatch} icon={<ChartBarIcon className="w-6 h-6"/>} />
                <QuickStat label="Est. Hours Left" value={`~${quickStats.hoursToWatch}h`} icon={<ClockIcon className="w-6 h-6"/>} />
            </div>

            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient">Up Next</h2>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 pl-3 pr-8 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                            >
                                <option value="lastWatched">Last Watched</option>
                                <option value="oldestWatched">Oldest Watched</option>
                                <option value="popularity">Popularity</option>
                                <option value="leastEpisodesLeft">Fewest Left</option>
                                <option value="mostEpisodesLeft">Most Left</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                        </div>
                        <button onClick={handleRefresh} disabled={isRefreshing || isLoading} className="p-2 bg-bg-secondary rounded-md text-text-primary hover:brightness-125 disabled:opacity-50" aria-label="Refresh Data">
                            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-card-gradient rounded-lg shadow-md p-4 animate-pulse h-48"></div>)}
                    </div>
                ) : sortedMedia.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {sortedMedia.map(item => {
                            if (item.media_type === 'tv') {
                                const showItem = item as EnrichedShowData;
                                const nextEp = showItem.nextEpisodeInfo;
                                const isFav = nextEp ? (favoriteEpisodes[item.id]?.[nextEp.season_number]?.[nextEp.episode_number] || false) : false;
                                return <ProgressCard key={item.id} item={showItem} {...props} isEpisodeFavorited={isFav} />;
                            } else {
                                const movieItem = item as EnrichedMovieData;
                                return <ProgressMovieCard key={item.id} item={movieItem} onSelectShow={props.onSelectShow} onStartLiveWatch={onStartLiveWatch} />
                            }
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-bg-secondary/30 rounded-lg">
                        {currentUser ? (
                             <>
                                <h2 className="text-xl font-bold text-text-primary">All Caught Up!</h2>
                                <p className="mt-2 text-text-secondary max-w-sm mx-auto">Add a new show to your "Watching" list or pause a movie to track it here.</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-text-primary">Welcome to Your Progress Page!</h2>
                                <p className="mt-2 text-text-secondary max-w-sm mx-auto">
                                    Your watched episodes and paused movies will be tracked here. Your data is currently saved on this device.
                                </p>
                                <button
                                    onClick={onAuthClick}
                                    className="mt-4 px-4 py-2 text-sm font-semibold rounded-full bg-accent-gradient text-on-accent hover:opacity-90 transition-opacity"
                                >
                                    Log In or Sign Up to Sync
                                </button>
                            </>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProgressScreen;
