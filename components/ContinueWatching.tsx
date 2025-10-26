import React, { useMemo } from 'react';
import { TrackedItem, WatchProgress, HistoryItem } from '../types';
import ContinueWatchingProgressCard from './ContinueWatchingProgressCard';

interface ContinueWatchingProps {
  watching: TrackedItem[];
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ watching, watchProgress, history, onSelectShow, onToggleEpisode }) => {
    const continueWatchingItems = useMemo(() => {
        // Filter for TV shows that are currently on the "watching" list and have some progress.
        const inProgressShows = watching.filter(item => {
            if (item.media_type !== 'tv') return false;
            const progress = watchProgress[item.id];
            // An item is "in progress" if there's any progress recorded for it.
            return progress && Object.keys(progress).length > 0;
        });

        // Create a map to find the most recent watch timestamp for each show from history.
        const lastWatchedMap = new Map<number, string>();
        for (const historyItem of history) {
            if (historyItem.media_type === 'tv' && !lastWatchedMap.has(historyItem.id)) {
                lastWatchedMap.set(historyItem.id, historyItem.timestamp);
            }
        }

        // Sort the in-progress shows by their last watched timestamp (newest first).
        const sortedInProgressShows = inProgressShows.sort((a, b) => {
            const timeA = lastWatchedMap.get(a.id) ? new Date(lastWatchedMap.get(a.id)!).getTime() : 0;
            const timeB = lastWatchedMap.get(b.id) ? new Date(lastWatchedMap.get(b.id)!).getTime() : 0;
            return timeB - timeA;
        });

        // Return the top 10 most recently watched shows.
        return sortedInProgressShows.slice(0, 10);

    }, [watching, watchProgress, history]);

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">Continue Watching</h2>
            {continueWatchingItems.length > 0 ? (
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4">
                    {continueWatchingItems.map(item => (
                        <div key={item.id} className="w-56 sm:w-64 flex-shrink-0">
                            <ContinueWatchingProgressCard
                                item={item}
                                watchProgress={watchProgress}
                                onSelectShow={onSelectShow}
                                onToggleEpisode={onToggleEpisode}
                            />
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