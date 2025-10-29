import React from 'react';
import { LiveWatchMediaInfo, TmdbMediaDetails, TrackedItem } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PlayIcon } from './Icons';
import { formatRuntime } from '../utils/formatUtils';
import BrandedImage from './BrandedImage';

export interface EnrichedMovieData extends TrackedItem {
    details: TmdbMediaDetails;
    elapsedSeconds: number;
    lastWatchedTimestamp: number;
    popularity: number;
    status: 'onHold';
}


interface ProgressMovieCardProps {
    item: EnrichedMovieData;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
}

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const parts: string[] = [];
    if (hours > 0) parts.push(String(hours));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));
    return parts.join(':');
};

const ProgressMovieCard: React.FC<ProgressMovieCardProps> = ({ item, onSelectShow, onStartLiveWatch }) => {
    const { elapsedSeconds, details } = item;
    const runtimeInSeconds = (details.runtime || 0) * 60;
    const progressPercent = runtimeInSeconds > 0 ? (elapsedSeconds / runtimeInSeconds) * 100 : 0;
    
    const handleResumeWatch = (e: React.MouseEvent) => {
        e.stopPropagation();
        const mediaInfo: LiveWatchMediaInfo = {
            id: item.id,
            media_type: 'movie',
            title: item.title,
            poster_path: item.poster_path,
            runtime: details.runtime || 90,
        };
        onStartLiveWatch(mediaInfo);
    };

    const showPosterUrl = getImageUrl(item.poster_path, 'w154');

    return (
        <div className="bg-card-gradient rounded-lg shadow-md flex overflow-hidden h-48">
            <div className="w-32 flex-shrink-0 cursor-pointer" onClick={() => onSelectShow(item.id, 'movie')}>
                <BrandedImage title={item.title}>
                    <img src={showPosterUrl} alt={item.title} className="w-full h-full object-cover" />
                </BrandedImage>
            </div>

            <div className="flex-grow relative group cursor-pointer" onClick={() => onSelectShow(item.id, 'movie')}>
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
                    <p className="text-sm text-white/80 truncate">
                        Paused at {formatTime(elapsedSeconds)}
                    </p>
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
            </div>
        </div>
    );
};

export default ProgressMovieCard;
