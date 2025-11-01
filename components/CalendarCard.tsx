import React from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { formatDate } from '../utils/formatUtils';
import { PLACEHOLDER_POSTER } from '../constants';
import { CalendarItem } from '../types';

interface CalendarCardProps {
    item: CalendarItem;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    timezone: string;
}

const CalendarCard: React.FC<CalendarCardProps> = ({ item, onSelect, timezone }) => {
    const posterUrl = getImageUrl(item.poster_path, 'w154');
    const mediaTypeColor = item.media_type === 'tv' ? 'border-red-500' : 'border-blue-500';

    return (
        <div 
            className={`w-40 flex-shrink-0 bg-card-gradient rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 border-t-4 ${mediaTypeColor}`}
            onClick={() => onSelect(item.id, item.media_type)}
        >
            <img src={posterUrl} alt={item.title} className="w-full h-60 object-cover"/>
            <div className="p-3">
                <p className="text-xs font-bold text-primary-accent">
                    {item.episodeInfo === 'Airing Soon'
                        ? 'Airing Soon'
                        : formatDate(item.date, timezone, { month: 'short', day: 'numeric' })}
                </p>
                <h4 className="font-bold text-sm text-text-primary truncate">{item.title}</h4>
                {item.episodeInfo && item.episodeInfo !== 'Airing Soon' && <p className="text-xs text-text-secondary truncate">{item.episodeInfo}</p>}
                {item.network && <p className="text-[10px] text-text-secondary/80 truncate">{item.network}</p>}
            </div>
        </div>
    );
};

export default CalendarCard;