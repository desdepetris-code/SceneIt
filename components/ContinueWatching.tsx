import React, { useMemo } from 'react';
import { TrackedItem, WatchProgress, HistoryItem, LiveWatchMediaInfo } from '../types';
import ContinueWatchingProgressCard from './ContinueWatchingProgressCard';
import ContinueWatchingMovieCard from './ContinueWatchingMovieCard';
import Carousel from './Carousel';

interface ContinueWatchingProps {
  watching: TrackedItem[];
  onHold: TrackedItem[];
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ watching, onHold, watchProgress, history, onSelectShow, onToggleEpisode, pausedLiveSessions }) => {
    const continueWatchingItems = useMemo(() => {
        const processList = (list: TrackedItem[]) => {
            return list.filter(item => {
                if (item.media_type !== 'tv') return false;
                const progress = watchProgress[item.id];
                return progress && Object.keys(progress).length > 0;
            });
        };
    
        const inProgressWatching = processList(watching);
        const inProgressOnHold = processList(onHold);

        const lastWatchedMap = new Map<number, string>();
        for (const historyItem of history) {
            if (historyItem.media_type === 'tv' && !lastWatchedMap.has(historyItem.id)) {
                lastWatchedMap.set(historyItem.id, historyItem.timestamp);
            }
        }
        
        const mapToTimestampedItem = (item: TrackedItem) => ({
            ...item,
            lastWatchedTimestamp: new Date(lastWatchedMap.get(item.id) || 0).getTime(),
        });

        // FIX: Explicitly type `session` to resolve 'unknown' type error.
        const pausedItems = Object.values(pausedLiveSessions).map((session: { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string; }) => ({
            ...session.mediaInfo,
            isPaused: true,
            elapsedSeconds: session.elapsedSeconds,
            lastWatchedTimestamp: new Date(session.pausedAt).getTime(),
        }));

        const tvItems = [...inProgressWatching.map(mapToTimestampedItem), ...inProgressOnHold.map(mapToTimestampedItem)];
        const tvItemsMap = new Map(tvItems.map(item => [item.id, item]));

        pausedItems.forEach(pausedItem => {
            if (pausedItem.media_type === 'tv') {
                tvItemsMap.set(pausedItem.id, { ...tvItemsMap.get(pausedItem.id), ...pausedItem });
            }
        });
        
        const combinedTvItems = Array.from(tvItemsMap.values());
        const movieItems = pausedItems.filter(item => item.media_type === 'movie');
        
        const combined = [...combinedTvItems, ...movieItems];
        combined.sort((a, b) => b.lastWatchedTimestamp - a.lastWatchedTimestamp);

        return combined.slice(0, 10);

    }, [watching, onHold, watchProgress, history, pausedLiveSessions]);

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">Continue Watching</h2>
            {continueWatchingItems.length > 0 ? (
                <Carousel>
                    <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
                        {continueWatchingItems.map(item => (
                            <div key={item.id} className="w-56 sm:w-64 flex-shrink-0">
                                {item.media_type === 'tv' ? (
                                    <ContinueWatchingProgressCard
                                        item={item as any}
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
                </Carousel>
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
