import React from 'react';
import { TrackedItem, TmdbMediaDetails, Episode, LiveWatchMediaInfo } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PlayIcon, CheckCircleIcon, HeartIcon } from './Icons';

// This type is based on what ProgressScreen prepares
export interface EnrichedShowData extends TrackedItem {
    details: TmdbMediaDetails;
    nextEpisodeInfo: Episode | null;
    watchedCount: number;
    totalEpisodes: number;
    lastWatchedTimestamp: number;
    popularity: number;
}

interface ProgressCardProps {
    item: EnrichedShowData;
    isEpisodeFavorited: boolean;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
    onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
    onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ item, isEpisodeFavorited, onSelectShow, onToggleEpisode, onStartLiveWatch, onToggleFavoriteEpisode }) => {
    const { details, nextEpisodeInfo, watchedCount, totalEpisodes } = item;
    const progressPercent = totalEpisodes > 0 ? (watchedCount / totalEpisodes) * 100 : 0;
    
    const handleMarkWatched = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (nextEpisodeInfo) {
            onToggleEpisode(item.id, nextEpisodeInfo.season_number, nextEpisodeInfo.episode_number, 0);
        }
    };
    
    const handleResumeWatch = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!nextEpisodeInfo) return;
        const mediaInfo: LiveWatchMediaInfo = {
            id: item.id,
            media_type: 'tv',
            title: item.title,
            poster_path: item.poster_path,
            runtime: details.episode_run_time?.[0] || 45,
            seasonNumber: nextEpisodeInfo.season_number,
            episodeNumber: nextEpisodeInfo.episode_number,
            episodeTitle: nextEpisodeInfo.name,
        };
        onStartLiveWatch(mediaInfo);
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(nextEpisodeInfo) {
            onToggleFavoriteEpisode(item.id, nextEpisodeInfo.season_number, nextEpisodeInfo.episode_number);
        }
    }

    const showPosterUrl = getImageUrl(item.poster_path, 'w154');
    
    return (
        <div className="bg-card-gradient rounded-lg shadow-md flex overflow-hidden h-48">
            <div className="w-32 flex-shrink-0 cursor-pointer" onClick={() => onSelectShow(item.id, 'tv')}>
                <img src={showPosterUrl} alt={item.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex-grow relative group cursor-pointer" onClick={() => onSelectShow(item.id, 'tv')}>
                <img src={getImageUrl(details.backdrop_path, 'w500', 'backdrop')} alt={item.title} className="w-full h-full object-cover" />
                
                <div 
                    onClick={handleResumeWatch}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    <div className="p-3 bg-backdrop rounded-full">
                        <PlayIcon className="w-6 h-6 text-white"/>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <h3 className="font-bold text-white truncate">{item.title}</h3>
                    {nextEpisodeInfo ? (
                        <p className="text-sm text-white/80 truncate">
                            Up next: S{nextEpisodeInfo.season_number} E{nextEpisodeInfo.episode_number} - {nextEpisodeInfo.name}
                        </p>
                    ) : (
                        <p className="text-sm text-green-400">All caught up!</p>
                    )}
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-white/80">
                            <span>Overall Progress</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                            <div className="bg-accent-gradient h-1 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>
                
                {nextEpisodeInfo && (
                    <div className="absolute top-2 right-2 flex space-x-1">
                        <button 
                            onClick={handleToggleFavorite}
                            className="p-1.5 bg-backdrop rounded-full text-white/80 hover:text-white hover:bg-yellow-500/50 transition-colors"
                            title={isEpisodeFavorited ? "Unfavorite episode" : "Favorite episode"}
                        >
                            <HeartIcon filled={isEpisodeFavorited} className={`w-5 h-5 ${isEpisodeFavorited ? 'text-yellow-400' : ''}`} />
                        </button>
                        <button 
                            onClick={handleMarkWatched}
                            className="p-1.5 bg-backdrop rounded-full text-white/80 hover:text-white hover:bg-green-500/50 transition-colors"
                            title="Mark next episode as watched"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressCard;
