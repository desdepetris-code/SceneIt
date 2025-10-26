

import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { TrashIcon, ChevronDownIcon } from '../components/Icons';

interface HistoryScreenProps {
  history: HistoryItem[];
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  onDeleteHistoryItem: (logId: string) => void;
}

type HistoryFilter = 'all' | 'tv' | 'movie';

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onSelectShow, onDeleteHistoryItem }) => {
    const [filter, setFilter] = useState<HistoryFilter>('all');

    const filteredHistory = useMemo(() => {
        if (filter === 'all') {
            return history;
        }
        return history.filter(item => item.media_type === filter);
    }, [history, filter]);

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6 relative max-w-xs">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as HistoryFilter)}
                    className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                >
                    <option value="all">All History</option>
                    <option value="tv">TV Shows</option>
                    <option value="movie">Movies</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
            </div>
      
            <section>
                <div className="bg-card-gradient rounded-lg shadow-md">
                    {filteredHistory.length > 0 ? (
                        <div className="divide-y divide-bg-secondary">
                            {filteredHistory.map(item => (
                                <div key={item.logId} className="flex items-center p-3 hover:bg-bg-secondary/50 rounded-lg">
                                    <img
                                        onClick={() => onSelectShow(item.id, item.media_type)}
                                        src={getImageUrl(item.poster_path, 'w92')}
                                        alt={item.title}
                                        className="w-10 h-15 rounded-md cursor-pointer"
                                    />
                                    <div className="ml-4 flex-grow cursor-pointer min-w-0" onClick={() => onSelectShow(item.id, item.media_type)}>
                                        <p className="font-semibold text-text-primary truncate">{item.title}</p>
                                        <p className="text-sm text-text-secondary">
                                            {item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Movie'}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-sm text-text-secondary">{formatTimestamp(item.timestamp).split(', ')[0]}</p>
                                        <p className="text-xs text-text-secondary/80">{formatTimestamp(item.timestamp).split(', ')[1]}</p>
                                    </div>
                                    <button
                                        onClick={() => onDeleteHistoryItem(item.logId)}
                                        className="ml-4 p-2 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                        aria-label="Delete history item"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="p-4 text-text-secondary text-center">No watch history for this filter.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default HistoryScreen;