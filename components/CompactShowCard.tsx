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
  showAddedAt?: boolean;
}

const CompactShowCard: React.FC<CompactShowCardProps> = ({ item, onSelect, showAddedAt }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

    useEffect(() => {
        let isMounted = true;
        getMediaDetails(item.id, item.media_type).then(data => {
            if (isMounted) setDetails(data);
        }).catch(console.error);
        return () => { isMounted = false; };
    }, [item.id, item.media_type]);
    
    const showStatusText = useMemo(() => {
      if (!details) return null;
      return getShowStatus(details)?.text ?? null;
    }, [details]);

    const ageRating = useMemo(() => {
        if (!details) return null;
        if (details.media_type === 'tv') {
          return details.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')?.rating || null;
        } else {
          return details.release_dates?.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.find(d => d.certification)?.certification || null;
        }
    }, [details]);

    const getAgeRatingColor = (rating: string) => {
        const r = rating.toUpperCase();
        if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
        if (r === 'TV-Y') return 'bg-[#008000] text-white';
        if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black';
        if (r === 'PG-13') return 'bg-[#00008B] text-white';
        if (r === 'TV-14') return 'bg-[#800000] text-white';
        if (r === 'R') return 'bg-[#FF00FF] text-black font-black';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-md';
        return 'bg-stone-500 text-white';
    };

    const posterSrcs = [item.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}` : null];
    const title = item.title;

    const formattedAddedDate = useMemo(() => {
        if (!item.addedAt) return null;
        return new Date(item.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }, [item.addedAt]);

    return (
        <div
            onClick={() => onSelect(item.id, item.media_type)}
            className="cursor-pointer group transform hover:-translate-y-1 transition-transform duration-300 h-full"
        >
            <div className="relative rounded-md overflow-hidden shadow-lg h-full">
                {ageRating && (
                    <div className={`absolute top-1 right-1 px-1 py-0.5 text-[8px] font-black rounded-sm backdrop-blur-md z-20 shadow-md border border-white/10 ${getAgeRatingColor(ageRating)}`}>
                        {ageRating}
                    </div>
                )}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 pl-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white text-xs font-bold text-center w-full leading-tight">{title}</h3>
                    {showAddedAt && formattedAddedDate && (
                        <p className="text-[8px] font-black text-primary-accent uppercase tracking-widest text-center w-full mt-1">Added: {formattedAddedDate}</p>
                    )}
                </div>
            </div>
            {showAddedAt && formattedAddedDate && (
                <div className="mt-1 text-center">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Added: {formattedAddedDate}</p>
                </div>
            )}
        </div>
    );
};

export default CompactShowCard;
