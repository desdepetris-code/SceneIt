import React, { useState, useEffect, useMemo } from 'react';
import { UserData, SeasonLogItem } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';

interface SeasonLogScreenProps {
    userData: UserData;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
}

const SeasonLogScreen: React.FC<SeasonLogScreenProps> = ({ userData, onSelectShow }) => {
    const [seasonLog, setSeasonLog] = useState<SeasonLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const calculateSeasonLog = async () => {
            setIsLoading(true);
            const tvShows = [...userData.watching, ...userData.completed].filter(item => item.media_type === 'tv');
            const uniqueTvShowIds = Array.from(new Set(tvShows.map(s => s.id)));

            const completedSeasons: SeasonLogItem[] = [];

            const detailPromises = uniqueTvShowIds.map(id => getMediaDetails(id, 'tv').catch(() => null));
            const allDetails = await Promise.all(detailPromises);

            for (const details of allDetails) {
                if (!details || !details.seasons) continue;

                const progressForShow = userData.watchProgress[details.id];
                if (!progressForShow) continue;

                const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);

                for (const season of seasonsForCalc) {
                    if (season.episode_count === 0) continue;

                    let watchedCount = 0;
                    for (let i = 1; i <= season.episode_count; i++) {
                        if (progressForShow[season.season_number]?.[i]?.status === 2) {
                            watchedCount++;
                        }
                    }

                    if (watchedCount >= season.episode_count) {
                        const seasonHistory = userData.history.filter(h => h.id === details.id && h.seasonNumber === season.season_number);
                        seasonHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        
                        const lastWatchedEpisode = seasonHistory.find(h => h.episodeNumber === season.episode_count) || seasonHistory[0];
                        
                        completedSeasons.push({
                            showId: details.id,
                            showTitle: details.name || 'Unknown Show',
                            posterPath: details.poster_path,
                            seasonNumber: season.season_number,
                            seasonName: season.name,
                            completionDate: lastWatchedEpisode ? lastWatchedEpisode.timestamp : new Date().toISOString(),
                        });
                    }
                }
            }
            
            completedSeasons.sort((a,b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());
            setSeasonLog(completedSeasons);
            setIsLoading(false);
        };

        calculateSeasonLog();
    }, [userData]);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-3 bg-bg-secondary/50 rounded-lg">
                        <div className="w-12 h-18 bg-bg-secondary rounded-md"></div>
                        <div className="ml-4 flex-grow space-y-2">
                            <div className="h-4 bg-bg-secondary rounded w-3/4"></div>
                            <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <section>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient mb-4">Completed Seasons Log</h2>
            {seasonLog.length > 0 ? (
                <div className="bg-card-gradient rounded-lg shadow-md divide-y divide-bg-secondary">
                    {seasonLog.map(item => (
                        <div 
                            key={`${item.showId}-${item.seasonNumber}`}
                            onClick={() => onSelectShow(item.showId, 'tv')}
                            className="flex items-center p-3 cursor-pointer hover:bg-bg-secondary/50"
                        >
                            <img src={getImageUrl(item.posterPath, 'w92')} alt={item.showTitle} className="w-12 h-18 rounded-md"/>
                            <div className="ml-4 flex-grow min-w-0">
                                <p className="font-semibold text-text-primary truncate">{item.showTitle}</p>
                                <p className="text-sm text-text-secondary">{item.seasonName}</p>
                            </div>
                            <p className="text-sm text-text-secondary flex-shrink-0 ml-4">{new Date(item.completionDate).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center bg-bg-secondary/30 rounded-lg">
                    <p className="text-text-secondary">You haven't completed any seasons yet. Keep watching!</p>
                </div>
            )}
        </section>
    );
};

export default SeasonLogScreen;
