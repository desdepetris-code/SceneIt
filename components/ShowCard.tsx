import React, { useState, useEffect, useMemo } from 'react';
import { TrackedItem, TmdbMedia, TmdbMediaDetails, TvdbShow } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import { getTvdbShowExtended } from '../services/tvdbService';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import BrandedImage from './BrandedImage';
import { getShowStatus } from '../utils/statusUtils';
import { getRating } from '../utils/ratingUtils';

interface ShowCardProps {
  item: TrackedItem | TmdbMedia;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // for TVDB images
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

const ShowCardSkeleton: React.FC = () => (
    <div className="w-full animate-pulse">
        <div className="w-full aspect-[2/3] bg-bg-secondary rounded-lg"></div>
        <div className="h-4 bg-bg-secondary rounded mt-2 w-3/4 mx-auto"></div>
    </div>
);


const ShowCard: React.FC<ShowCardProps> = ({ item, onSelect }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [tvdbDetails, setTvdbDetails] = useState<TvdbShow | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const tmdbData = await getMediaDetails(item.id, item.media_type);
                if (!isMounted) return;

                setDetails(tmdbData);

                if (item.media_type === 'tv' && tmdbData.external_ids?.tvdb_id) {
                    const tvdbData = await getTvdbShowExtended(tmdbData.external_ids.tvdb_id);
                    if (isMounted) setTvdbDetails(tvdbData);
                }
            } catch (error) {
                console.error(`Failed to fetch details for ${item.id}`, error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [item.id, item.media_type]);

    const showStatusText = useMemo(() => {
        if (!details) return null;
        return getShowStatus(details)?.text ?? null;
    }, [details]);
    
    const ratingInfo = useMemo(() => {
        if (!details) return null;
        return getRating(details);
    }, [details]);

    const posterSrcs = useMemo(() => {
        const paths = item.media_type === 'tv'
            ? [
                details?.poster_path,
                item.poster_path
              ]
            : [
                details?.poster_path,
                item.poster_path
              ];
        
        return paths.map(p => getFullImageUrl(p, 'w342'));
    }, [details, item.media_type, item.poster_path]);

    const title = details?.title || details?.name || (item as TmdbMedia).title || (item as TmdbMedia).name || 'Untitled';

    if (loading) {
        return <ShowCardSkeleton />;
    }

    return (
        <div
            onClick={() => onSelect(item.id, item.media_type)}
            className="cursor-pointer group transform hover:-translate-y-2 transition-transform duration-300"
        >
            <div className="relative rounded-lg overflow-hidden shadow-lg">
                <BrandedImage title={title} status={item.media_type === 'tv' ? showStatusText : null}>
                    <FallbackImage
                        srcs={posterSrcs}
                        placeholder={PLACEHOLDER_POSTER}
                        noPlaceholder={true}
                        alt={title}
                        className="w-full aspect-[2/3] object-cover"
                        loading="lazy"
                    />
                </BrandedImage>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2 pl-8">
                     <div className="w-full flex justify-center items-baseline space-x-2 overflow-hidden">
                        <h3 className="text-white text-sm font-bold truncate">{title}</h3>
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
                </div>
            </div>
        </div>
    );
};

export default ShowCard;
