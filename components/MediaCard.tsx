import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMedia, TmdbMediaDetails } from '../types';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import BrandedImage from './BrandedImage';
import { getMediaDetails } from '../services/tmdbService';
import { getShowStatus } from '../utils/statusUtils';
import { getRating } from '../utils/ratingUtils';

interface MediaCardProps {
  item: TmdbMedia;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onSelect }) => {
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Fetch details to get status and rating info
    getMediaDetails(item.id, item.media_type).then(data => {
        if (isMounted) {
            setDetails(data);
        }
    }).catch(console.error);
    return () => { isMounted = false; };
  }, [item.id, item.media_type]);

  const showStatusText = useMemo(() => {
      if (!details) return null;
      return getShowStatus(details)?.text ?? null;
  }, [details]);

  const ratingInfo = useMemo(() => {
    if (!details) return null;
    return getRating(details);
  }, [details]);

  const posterSrcs = [item.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}` : null];

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date)?.substring(0, 4);

  return (
    <div 
      className="relative group cursor-pointer"
      onClick={() => onSelect(item.id, item.media_type)}
    >
      <div className="rounded-lg overflow-hidden shadow-lg">
        <BrandedImage title={title || ''} status={item.media_type === 'tv' ? showStatusText : null}>
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
        <div className="absolute bottom-0 left-0 p-3 pl-8 w-full">
            <div className="flex items-baseline space-x-2">
                <h3 className="text-white text-sm font-bold truncate shrink">{title}</h3>
                {ratingInfo ? (
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${ratingInfo.colorClass} border-current whitespace-nowrap flex-shrink-0`}>
                        {ratingInfo.rating}
                    </span>
                ) : (
                     <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded border border-gray-500/50 text-gray-400 whitespace-nowrap flex-shrink-0">
                        Unrated
                    </span>
                )}
            </div>
            {year && <p className="text-slate-300 text-xs mt-0.5">{year}</p>}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
