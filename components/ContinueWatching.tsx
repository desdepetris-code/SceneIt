import React, { useMemo } from 'react';
import { TrackedItem, WatchProgress, HistoryItem, LiveWatchMediaInfo, UserData } from '../types';
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
  globalPlaceholders?: UserData['globalPlaceholders'];
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ watching, onHold, watchProgress, history, onSelectShow, onToggleEpisode, pausedLiveSessions, globalPlaceholders }) => {
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

        const pausedItems = Object.values(pausedLiveSessions).map((session: { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string; }) => ({
            ...session.mediaInfo,
            isPaused: true,
            elapsedSeconds: session.elapsedSeconds,
            lastWatchedTimestamp: new Date(session.pausedAt).getTime(),
        }));

        const tvItems = [
            ...inProgressWatching.map(mapToTimestampedItem), 
            ...inProgressOnHold.map(mapToTimestampedItem)
        ];
        const tvItemsMap = new Map(tvItems.map(item => [item.id, item]));

        pausedItems.forEach(pausedItem => {
            if (pausedItem.media_type === 'tv') {
                tvItemsMap.set(pausedItem.id, { ...tvItemsMap.get(pausedItem.id), ...pausedItem });
            }
        });

        const pausedMovies = pausedItems.filter(item => item.media_type === 'movie');

        const allItems = [...Array.from(tvItemsMap.values()), ...pausedMovies];

        return allItems.sort((a, b) => b.lastWatchedTimestamp - a.lastWatchedTimestamp);
        
    }, [watching, onHold, watchProgress, history, pausedLiveSessions]);

    if (continueWatchingItems.length === 0) {
        return null;
    }

    return (
        <div className="my-8">
            <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">Continue Watching</h2>
            <Carousel>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
                    {continueWatchingItems.map(item => (
                        <div key={item.id} className="w-72 flex-shrink-0">
                            {item.media_type === 'tv' ? (
                                <ContinueWatchingProgressCard
                                    item={item as (TrackedItem & { isPaused?: boolean; elapsedSeconds?: number; seasonNumber?: number; episodeNumber?: number; episodeTitle?: string; runtime?: number; })}
                                    watchProgress={watchProgress}
                                    onSelectShow={onSelectShow}
                                    onToggleEpisode={onToggleEpisode}
                                    globalPlaceholders={globalPlaceholders}
                                />
                            ) : (
                                <ContinueWatchingMovieCard
                                    mediaInfo={item as LiveWatchMediaInfo}
                                    elapsedSeconds={item.elapsedSeconds || 0}
                                    onSelectShow={onSelectShow}
                                    globalPlaceholders={globalPlaceholders}
                                />
                            )}
                        </div>
                    ))}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </Carousel>
        </div>
    );
};

export default ContinueWatching;