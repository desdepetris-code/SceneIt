import React, { useState, useEffect, useMemo } from 'react';
// FIX: Removed ManualMediaDetails as it is not defined in types.ts and part of a removed feature.
import { TmdbMediaDetails, TrackedItem, WatchProgress } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
// FIX: Removed import from empty file 'manualEntryUtils.ts' which was causing an error.
// import { transformManualToTmdbDetails } from '../utils/manualEntryUtils';

interface ProgressItemProps {
    item: TrackedItem;
    watchProgress: WatchProgress;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    // FIX: Removed manualEntries as it relies on the non-existent ManualMediaDetails type.
    // manualEntries: Record<number, ManualMediaDetails>;
}

// FIX: Removed manualEntries from props.
const ProgressItem: React.FC<ProgressItemProps> = ({ item, watchProgress, onSelect }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

    useEffect(() => {
        // FIX: Removed logic for manual entries as the feature is not present.
        getMediaDetails(item.id, 'tv').then(setDetails).catch(console.error);
    }, [item]);

    const { progressPercent, totalEpisodes, watchedEpisodes } = useMemo(() => {
        if (!details) return { progressPercent: 0, totalEpisodes: 0, watchedEpisodes: 0 };
        
        let total = 0;
        let seasonsForCalc: { season_number: number, episode_count: number }[] = [];

        // FIX: Removed logic for manual entries.
        if (!details.seasons) return { progressPercent: 0, totalEpisodes: 0, watchedEpisodes: 0 };
        total = details.seasons.filter(s => s.season_number > 0).reduce((acc, s) => acc + s.episode_count, 0);
        seasonsForCalc = details.seasons;
        
        let watched = 0;
        const progressForShow = watchProgress[item.id] || {};

        for (const season of [...seasonsForCalc].sort((a,b) => a.season_number - b.season_number)) {
            // FIX: Simplified condition to remove check for manual entries.
            if (season.season_number === 0) continue;
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status === 2) {
                    watched++;
                }
            }
        }
        
        const percent = total > 0 ? (watched / total) * 100 : 0;
        return { progressPercent: percent, totalEpisodes: total, watchedEpisodes: watched };
    }, [details, watchProgress, item.id]);
    
    if (!details) return null;
    
    const posterUrl = getImageUrl(item.poster_path, 'w342', 'poster');

    return (
        <div 
            onClick={() => onSelect(item.id, 'tv')} 
            className="flex-shrink-0 w-40 m-2 cursor-pointer group transform hover:-translate-y-2 transition-transform duration-300"
        >
            <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden">
                <img src={posterUrl} alt={item.title} className="w-full h-60 object-cover" loading="lazy"/>
                <div className="p-2">
                    <h4 className="font-bold truncate text-sm text-text-primary">{item.title}</h4>
                     <div className="mt-1 w-full bg-bg-primary rounded-full h-1.5">
                        <div 
                            className="bg-accent-gradient h-1.5 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                        <span className="text-xs text-text-secondary">{watchedEpisodes} / {totalEpisodes}</span>
                        <span className="text-xs text-text-secondary font-semibold">{Math.round(progressPercent)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressItem;