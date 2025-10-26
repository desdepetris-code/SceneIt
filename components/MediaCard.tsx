


import React from 'react';
import { TmdbMedia } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface MediaCardProps {
  item: TmdbMedia;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onSelect }) => {
  const imageUrl = getImageUrl(item.poster_path);

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date)?.substring(0, 4);

  return (
    <div 
      className="relative group cursor-pointer"
      onClick={() => onSelect(item.id, item.media_type)}
    >
      <div className="rounded-lg overflow-hidden shadow-lg">
        <img src={imageUrl} alt={title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3">
          <h3 className="text-white text-sm font-bold">{title}</h3>
          {year && <p className="text-slate-300 text-xs">{year}</p>}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;