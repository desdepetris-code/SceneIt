import React from 'react';
import { TmdbMedia } from '../types';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import BrandedImage from './BrandedImage';

interface MediaCardProps {
  item: TmdbMedia;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onSelect }) => {
  const posterSrcs = [item.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}` : null];

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date)?.substring(0, 4);

  return (
    <div 
      className="relative group cursor-pointer"
      onClick={() => onSelect(item.id, item.media_type)}
    >
      <div className="rounded-lg overflow-hidden shadow-lg">
        <BrandedImage title={title || ''}>
            <FallbackImage
                srcs={posterSrcs}
                placeholder={PLACEHOLDER_POSTER}
                noPlaceholder={true}
                alt={title || ''}
                className="w-full aspect-[2/3] object-cover"
                loading="lazy"
            />
        </BrandedImage>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3 pl-8">
          <h3 className="text-white text-sm font-bold">{title}</h3>
          {year && <p className="text-slate-300 text-xs">{year}</p>}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
