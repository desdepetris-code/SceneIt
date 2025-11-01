import React, { useState, useEffect, useMemo } from 'react';
import { UserData, JournalEntry, ShowProgress, SeasonProgress } from '../../types';
import { getMediaDetails } from '../../services/tmdbService';
import { getImageUrl } from '../../utils/imageUtils';

interface JournalItem {
    entry: JournalEntry;
    showId: number;
    seasonNumber: number;
    episodeNumber: number;
    mediaType: 'tv' | 'movie';
}

interface JournalWidgetProps {
    userData: UserData;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
    onNavigate?: () => void; // For compact view
    isFullScreen?: boolean; // To render all items
}

const JournalWidget: React.FC<JournalWidgetProps> = ({ userData, onSelectShow, onNavigate, isFullScreen = false }) => {
    const [mediaDetailsCache, setMediaDetailsCache] = useState<Record<string, {name: string, poster_path: string | null}>>({});

    const allJournalItems = useMemo(() => {
        const items: JournalItem[] = [];
        Object.entries(userData.watchProgress).forEach(([showId, seasons]) => {
            Object.entries(seasons as ShowProgress).forEach(([seasonNumber, episodes]) => {
                Object.entries(episodes as SeasonProgress).forEach(([episodeNumber, progress]) => {
                    if (progress.journal) {
                        const isMovie = +seasonNumber === 0 && +episodeNumber === 0;
                        items.push({
                            entry: progress.journal,
                            showId: +showId,
                            seasonNumber: +seasonNumber,
                            episodeNumber: +episodeNumber,
                            mediaType: isMovie ? 'movie' : 'tv',
                        });
                    }
                });
            });
        });
        return items.sort((a,b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime());
    }, [userData.watchProgress]);

    const itemsToDisplay = isFullScreen ? allJournalItems : allJournalItems.slice(0, 3);
    
    useEffect(() => {
        const fetchMissingDetails = async () => {
            const missingItems = itemsToDisplay.filter(item => !mediaDetailsCache[`${item.mediaType}-${item.showId}`]);
            if (missingItems.length === 0) return;

            const newDetails: Record<string, {name: string, poster_path: string | null}> = {};
            const uniqueMissing = Array.from(new Map(missingItems.map(item => [`${item.mediaType}-${item.showId}`, item])).values());
            
            await Promise.all(uniqueMissing.map(async (item: JournalItem) => {
                try {
                    const details = await getMediaDetails(item.showId, item.mediaType);
                    newDetails[`${item.mediaType}-${item.showId}`] = { name: details.name || 'Unknown', poster_path: details.poster_path };
                } catch (e) { console.error(e) }
            }));

            setMediaDetailsCache(prev => ({ ...prev, ...newDetails }));
        };
        fetchMissingDetails();
    }, [itemsToDisplay, mediaDetailsCache]);
    
    return (
        <div className="bg-card-gradient rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-text-primary p-4">Recent Journal Entries</h3>
             {itemsToDisplay.length > 0 ? (
                <div className="divide-y divide-bg-secondary">
                    {itemsToDisplay.map(item => {
                         const details = mediaDetailsCache[`${item.mediaType}-${item.showId}`];
                         return (
                            <div key={item.entry.timestamp} onClick={() => onSelectShow(item.showId, item.mediaType)} className="p-3 flex space-x-4 cursor-pointer hover:bg-bg-secondary/50">
                                <img src={getImageUrl(details?.poster_path, 'w92')} alt="" className="w-12 h-18 rounded-md flex-shrink-0" />
                                <div className="min-w-0">
                                    <div className="flex items-baseline space-x-2">
                                        <p className="font-semibold text-text-primary truncate">{details?.name || 'Loading...'}</p>
                                        <p className="text-xs text-text-secondary flex-shrink-0">{new Date(item.entry.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-sm font-bold">{item.entry.mood}</p>
                                    <p className="text-sm text-text-secondary line-clamp-2">{item.entry.text}</p>
                                </div>
                            </div>
                         )
                    })}
                </div>
            ) : (
                <p className="p-4 text-text-secondary">No journal entries yet.</p>
            )}
             {onNavigate && allJournalItems.length > 3 && (
                <button onClick={onNavigate} className="w-full p-2 text-center text-sm font-semibold text-primary-accent hover:underline">
                    View All Journal Entries
                </button>
            )}
        </div>
    );
};

export default JournalWidget;
