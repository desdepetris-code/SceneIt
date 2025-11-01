import React, { useState, useEffect, useMemo } from 'react';
import { TrackedItem, TmdbMediaDetails } from '../types';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import BrandedImage from './BrandedImage';
import { getMediaDetails } from '../services/tmdbService';
import { getShowStatus } from '../utils/statusUtils';

interface CompactShowCardProps {
  item: TrackedItem;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const CompactShowCard: React.FC<CompactShowCardProps> = ({ item, onSelect }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (item.media_type === 'tv') {
            getMediaDetails(item.id, 'tv').then(data => {
                if (isMounted) setDetails(data);
            }).catch(console.error);
        } else {
            setDetails(null);
        }
        return () => { isMounted = false; };
    }, [item.id, item.media_type]);
    
    // FIX: Extract the 'text' property from the status object to pass a string to the 'BrandedImage' component.
    const showStatusText = useMemo(() => {
      if (!details) return null;
      return getShowStatus(details)?.text ?? null;
    }, [details]);

    const posterSrcs = [item.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}` : null];
    const title = item.title;

    return (
        <div
            onClick={() => onSelect(item.id, item.media_type)}
            className="cursor-pointer group transform hover:-translate-y-1 transition-transform duration-300"
        >
            <div className="relative rounded-md overflow-hidden shadow-lg">
                <BrandedImage title={title} status={item.media_type === 'tv' ? showStatusText : null}>
                    <FallbackImage
                        srcs={posterSrcs}
                        placeholder={PLACEHOLDER_POSTER}
                        noPlaceholder={true}
                        alt={title}
                        className="w-full aspect-[2/3] object-cover bg-bg-secondary"
                        loading="lazy"
                    />
                </BrandedImage>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2 pl-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white text-xs font-bold text-center w-full">{title}</h3>
                </div>
            </div>
        </div>
    );
};

export default CompactShowCard;