import React, { useMemo } from 'react';
import { TrackedItem, WatchProgress, HistoryItem, LiveWatchMediaInfo } from '../types';
import ContinueWatchingProgressCard from './ContinueWatchingProgressCard';
import ContinueWatchingMovieCard from './ContinueWatchingMovieCard';

interface ContinueWatchingProps {
  watching: TrackedItem[];
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ watching, watchProgress, history, onSelectShow, onToggleEpisode, pausedLiveSessions }) => {
    const continueWatchingItems = useMemo(() => {
        // TV Shows
        const inProgressShows = watching.filter(item => {
            if (item.media_type !== 'tv') return false;
            const progress = watchProgress[item.id];
            return progress && Object.keys(progress).length > 0;
        });

        const lastWatchedMap = new Map<number, string>();
        for (const historyItem of history) {
            if (historyItem.media_type === 'tv' && !lastWatchedMap.has(historyItem.id)) {
                lastWatchedMap.set(historyItem.id, historyItem.timestamp);
            }
        }

        const tvItems = inProgressShows.map(item => ({
            ...item,
            lastWatchedTimestamp: new Date(lastWatchedMap.get(item.id) || 0).getTime(),
        }));

        // Paused Movies
        const movieItems = (Object.values(pausedLiveSessions) as { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }[])
            .filter(session => session.mediaInfo.media_type === 'movie')
            .map(session => ({
                ...session.mediaInfo,
                media_type: 'movie' as const, // ensure type correctness
                elapsedSeconds: session.elapsedSeconds,
                lastWatchedTimestamp: new Date(session.pausedAt).getTime(),
            }));
        
        // Combine and sort
        const combined = [...tvItems, ...movieItems];
        combined.sort((a, b) => b.lastWatchedTimestamp - a.lastWatchedTimestamp);

        return combined.slice(0, 10);

    }, [watching, watchProgress, history, pausedLiveSessions]);

    if (continueWatchingItems.length === 0) {
        return null; // Don't render the section if there's nothing to show
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">Continue Watching</h2>
            {continueWatchingItems.length > 0 ? (
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4">
                    {continueWatchingItems.map(item => (
                        <div key={item.id} className="w-56 sm:w-64 flex-shrink-0">
                            {item.media_type === 'tv' ? (
                                <ContinueWatchingProgressCard
                                    item={item as TrackedItem} // It's a TrackedItem with extra props
                                    watchProgress={watchProgress}
                                    onSelectShow={onSelectShow}
                                    onToggleEpisode={onToggleEpisode}
                                />
                            ) : (
                                <ContinueWatchingMovieCard
                                    mediaInfo={item as LiveWatchMediaInfo}
                                    elapsedSeconds={(item as any).elapsedSeconds}
                                    onSelectShow={onSelectShow}
                                />
                            )}
                        </div>
                    ))}
                     <div className="w-4 flex-shrink-0"></div>
                </div>
            ) : (
                <div className="px-6">
                    <div className="text-center py-10 bg-bg-secondary/30 rounded-lg">
                        <p className="text-text-secondary">Start watching a TV show to see your progress here!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContinueWatching;