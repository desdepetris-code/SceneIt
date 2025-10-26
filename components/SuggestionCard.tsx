import React from 'react';
import { TmdbMedia } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PlusIcon } from './Icons';

interface SuggestionCardProps {
  item: TmdbMedia;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
  onAddClick: (item: TmdbMedia) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ item, onSelect, onAddClick }) => {
    const posterSrc = getImageUrl(item.poster_path, 'w342');
    const title = item.title || item.name;

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click when clicking the button
        onAddClick(item);
    };

    return (
        <div
            onClick={() => onSelect(item.id, item.media_type)}
            className="cursor-pointer group relative transform hover:-translate-y-1 transition-transform duration-300"
        >
            <img
                src={posterSrc}
                alt={title}
                className="w-full aspect-[2/3] object-cover bg-bg-secondary rounded-lg shadow-lg"
                loading="lazy"
            />
            <button 
                onClick={handleAdd}
                className="absolute top-2 right-2 z-10 p-1.5 bg-backdrop rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-primary-accent transition-all"
                aria-label={`Add ${title} to a list`}
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default SuggestionCard;
