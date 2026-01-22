import React from 'react';
import { LiveWatchMediaInfo, UserData } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PlayIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER } from '../constants';
import BrandedImage from './BrandedImage';
import { formatTime } from '../utils/formatUtils';

interface ContinueWatchingMovieCardProps {
    mediaInfo: LiveWatchMediaInfo;
    elapsedSeconds: number;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    globalPlaceholders?: UserData['globalPlaceholders'];
}

const ContinueWatchingMovieCard: React.FC<ContinueWatchingMovieCardProps> = ({ mediaInfo, elapsedSeconds, onSelectShow, globalPlaceholders }) => {
    const posterUrl = getImageUrl(mediaInfo.poster_path, 'w342', 'poster');
    const runtimeInSeconds = mediaInfo.runtime > 0 ? mediaInfo.runtime * 60 : 0;
    const progressPercent = runtimeInSeconds > 0 ? (elapsedSeconds / runtimeInSeconds) * 100 : 0;
    const remainingSeconds = Math.max(0, runtimeInSeconds - elapsedSeconds);

    return (
        <div 
            className="w-full aspect-[10/16] bg-card-gradient rounded-lg shadow-lg flex flex-col relative overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-2"
            onClick={() => onSelectShow(mediaInfo.id, 'movie')}
        >
            <BrandedImage title={mediaInfo.title}>
                <FallbackImage 
                    srcs={[posterUrl]}
                    placeholder={PLACEHOLDER_POSTER}
                    type="poster"
                    globalPlaceholders={globalPlaceholders}
                    alt={`${mediaInfo.title} poster`} 
                    className="absolute inset-0 w-full h-full object-cover" 
                />
            </BrandedImage>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-4 bg-backdrop rounded-full">
                    <PlayIcon className="w-8 h-8 text-white" />
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 pl-8 mt-auto">
                <h3 className="font-bold text-white text-lg truncate [text-shadow:0_1px_3px_#000]">{mediaInfo.title}</h3>
                <p className="text-sm text-amber-300 font-semibold [text-shadow:0_1px_3px_#000]">{formatTime(remainingSeconds)} remaining</p>
                <p className="text-xs text-white/80 [text-shadow:0_1px_3px_#000]">{Math.round(progressPercent)}% watched</p>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20">
                <div className="h-full bg-accent-gradient transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>
    );
};

export default ContinueWatchingMovieCard;