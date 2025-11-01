import React, { useState } from 'react';
import { FullSeasonDrop, Episode, EpisodeWithAirtime } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { formatAirtime } from '../utils/formatUtils';
import { ChevronDownIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';

interface FullSeasonDropItemProps {
    item: FullSeasonDrop;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const FullSeasonDropItem: React.FC<FullSeasonDropItemProps> = ({ item, onSelectShow }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const posterUrl = getImageUrl(item.poster_path, 'w154');
    const formattedAirtime = formatAirtime(item.airtime);

    return (
        <div className="bg-bg-secondary/50 rounded-lg overflow-hidden">
            <div className="flex items-center p-2">
                <div
                    className="flex items-center flex-grow min-w-0 cursor-pointer"
                    onClick={() => onSelectShow(item.showId, 'tv')}
                >
                    <img
                        src={posterUrl}
                        alt={item.showTitle}
                        className="w-12 h-18 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-grow min-w-0 mx-4">
                        <p className="font-semibold text-text-primary truncate">{item.showTitle}</p>
                        <p className="text-sm text-text-secondary truncate">{item.seasonName}</p>
                        <p className="text-xs font-bold text-primary-accent mt-1">
                            Full Season Drop ({item.episodes.length} Episodes)
                            {formattedAirtime && ` • ${formattedAirtime}`}
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full hover:bg-bg-primary/50 transition-colors flex-shrink-0">
                    <ChevronDownIcon className={`w-6 h-6 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isExpanded && (
                <div className="border-t border-bg-secondary p-2 space-y-2 max-h-96 overflow-y-auto">
                    {item.episodes.map(ep => {
                        const epWithAirtime = ep as EpisodeWithAirtime;
                        const episodeFormattedAirtime = formatAirtime(epWithAirtime.airtime);
                        return (
                            <div key={ep.id} className="flex items-start space-x-3 p-1 rounded-md">
                                <FallbackImage
                                    srcs={[getImageUrl(ep.still_path, 'w300', 'still')]}
                                    placeholder={PLACEHOLDER_STILL}
                                    alt={ep.name}
                                    className="w-24 h-14 object-cover rounded-md flex-shrink-0 bg-bg-primary"
                                />
                                <div className="flex-grow min-w-0">
                                    <p className="text-sm font-semibold text-text-primary truncate">
                                        {ep.episode_number}. {ep.name}
                                    </p>
                                    <div className="text-xs text-text-secondary/80 flex items-center space-x-2">
                                        {episodeFormattedAirtime && <span>{episodeFormattedAirtime}</span>}
                                        {item.network && episodeFormattedAirtime && <span>&bull;</span>}
                                        {item.network && <span>{item.network}</span>}
                                    </div>
                                    <p className="text-xs text-text-secondary line-clamp-2 mt-1">{ep.overview}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FullSeasonDropItem;