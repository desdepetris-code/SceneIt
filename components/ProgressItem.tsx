import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMediaDetails, TrackedItem, WatchProgress, EpisodeTag, EpisodeProgress } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import { getRating } from '../utils/ratingUtils';

interface ProgressItemProps {
    item: TrackedItem;
    watchProgress: WatchProgress;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

export const ProgressItem: React.FC<ProgressItemProps> = ({ item, watchProgress, onSelect }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

    useEffect(() => {
        getMediaDetails(item.id, 'tv').then(setDetails).catch(console.error);
    }, [item]);

    const ratingInfo = useMemo(() => {
        if (!details) return null;
        return getRating(details);
    }, [details]);

    const { 
        overallProgressPercent, 
        totalEpisodes, 
        watchedEpisodes,
        seasonProgressPercent,
        episodesLeftInSeason,
        currentSeasonNumber,
        episodeTag
    } = useMemo(() => {
        if (!details || !details.seasons) return { 
            overallProgressPercent: 0, totalEpisodes: 0, watchedEpisodes: 0, 
            seasonProgressPercent: 0, episodesLeftInSeason: 0, currentSeasonNumber: 0,
            episodeTag: null
        };
        
        const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);
        const total = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);
        
        let watched = 0;
        const progressForShow = watchProgress[item.id] || {};

        for (const season of seasonsForCalc) {
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status === 2) {
                    watched++;
                }
            }
        }

        let nextEp = null;
        let tag: EpisodeTag | null = null;
        let sProgress = 0;
        let sLeft = 0;
        let currentSNum = 0;

        const sortedSeasons = [...seasonsForCalc].sort((a,b) => a.season_number - b.season_number);
        for (const season of sortedSeasons) {
            let foundNextInSeason = false;
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status !== 2) {
                    const partialEpisode = { episode_number: i, season_number: season.season_number, name: '', id: 0, overview: '', still_path: null, air_date: '' };
                    tag = getEpisodeTag(partialEpisode, season, details, undefined);
                    nextEp = partialEpisode;

                    // Calculate season progress for *this* season
                    // FIX: Explicitly cast 'ep' to EpisodeProgress to resolve TypeScript error where 'status' was not recognized.
                    const watchedInSeason = Object.values(progressForShow[season.season_number] || {}).filter(ep => (ep as EpisodeProgress).status === 2).length;
                    sProgress = season.episode_count > 0 ? (watchedInSeason / season.episode_count) * 100 : 0;
                    sLeft = season.episode_count - watchedInSeason;
                    currentSNum = season.season_number;

                    foundNextInSeason = true;
                    break;
                }
            }
            if (foundNextInSeason) break;
        }

        if (!nextEp && total > 0 && watched >= total) {
            // All caught up, show stats for the last season
            const lastSeason = sortedSeasons[sortedSeasons.length - 1];
            if (lastSeason) {
                sProgress = 100;
                sLeft = 0;
                currentSNum = lastSeason.season_number;
            }
        }
        
        const overallPercent = total > 0 ? (watched / total) * 100 : 0;
        return { 
            overallProgressPercent: overallPercent, 
            totalEpisodes: total, 
            watchedEpisodes: watched, 
            episodeTag: tag,
            seasonProgressPercent: sProgress,
            episodesLeftInSeason: sLeft,
            currentSeasonNumber: currentSNum
        };
    }, [details, watchProgress, item.id]);
    
    if (!details) return null;
    
    const posterUrl = getImageUrl(item.poster_path, 'w342', 'poster');

    return (
        <div 
            onClick={() => onSelect(item.id, 'tv')} 
            className="flex-shrink-0 w-40 m-2 cursor-pointer group transform hover:-translate-y-2 transition-transform duration-300"
        >
            <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden relative">
                <img src={posterUrl} alt={item.title} className="w-full h-60 object-cover" loading="lazy"/>
                {episodeTag && (
                    <div className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${episodeTag.className}`}>
                        {episodeTag.text}
                    </div>
                )}
                <div className="p-2 space-y-2">
                    <div className="flex items-baseline justify-between space-x-1">
                        <h4 className="font-bold truncate text-sm text-text-primary shrink">{item.title}</h4>
                        {ratingInfo ? (
                            <span className={`px-1 py-0.5 text-[9px] font-semibold rounded border ${ratingInfo.colorClass} border-current whitespace-nowrap flex-shrink-0`}>
                                {ratingInfo.rating}
                            </span>
                        ) : (
                             <span className="px-1 py-0.5 text-[9px] font-semibold rounded border border-gray-500/50 text-gray-400 whitespace-nowrap flex-shrink-0">
                                Unrated
                            </span>
                        )}
                    </div>
                    {/* Overall Progress */}
                    {totalEpisodes > 0 && (
                        <div>
                            <div className="flex justify-between items-center text-[10px] text-text-secondary mt-1">
                                <span>Overall</span>
                                <span>{watchedEpisodes}/{totalEpisodes}</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-1.5 mt-0.5">
                                <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${overallProgressPercent}%` }}></div>
                            </div>
                        </div>
                    )}
                    {/* Season Progress */}
                    {currentSeasonNumber > 0 && (
                        <div>
                            <div className="flex justify-between items-center text-[10px] text-text-secondary mt-1">
                                <span>Season {currentSeasonNumber}</span>
                                <span>{episodesLeftInSeason} left</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-1.5 mt-0.5">
                                <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${seasonProgressPercent}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
