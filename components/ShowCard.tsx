import React, { useState, useEffect, useMemo } from 'react';
import { TrackedItem, TmdbMedia, TmdbMediaDetails, TvdbShow } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import { getTvdbShowExtended } from '../services/tvdbService';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import BrandedImage from './BrandedImage';
import { getShowStatus } from '../utils/statusUtils';
import { getRecentEpisodeCount, isNewRelease } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';

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
    const [recentEpisodeCount, setRecentEpisodeCount] = useState(0);

    const isNew = isNewRelease((item as TmdbMedia).release_date || (item as TmdbMedia).first_air_date);

    useEffect(() => {
        let isMounted = true;
        const fetchDetails = async () => {
            setLoading(true);
            setRecentEpisodeCount(0);
            try {
                const tmdbData = await getMediaDetails(item.id, item.media_type);
                if (!isMounted) return;

                setDetails(tmdbData);

                if (item.media_type === 'tv') {
                    if (!isNew) {
                        const count = getRecentEpisodeCount(tmdbData);
                        if (isMounted) setRecentEpisodeCount(count);
                    }
                    if (tmdbData.external_ids?.tvdb_id) {
                        const tvdbData = await getTvdbShowExtended(tmdbData.external_ids.tvdb_id);
                        if (isMounted) setTvdbDetails(tvdbData);
                    }
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
    }, [item.id, item.media_type, isNew]);

    const showStatusText = useMemo(() => {
        if (!details) return null;
        return getShowStatus(details)?.text ?? null;
    }, [details]);

    const posterSrcs = useMemo(() => {
        const tvdbPoster = tvdbDetails?.artworks?.find(art => art.type === 2)?.image;
        const paths = item.media_type === 'tv'
            ? [
                tvdbPoster,
                details?.poster_path,
                item.poster_path
              ]
            : [
                details?.poster_path,
                item.poster_path
              ];
        
        return paths.map(p => getFullImageUrl(p, 'w342'));
    }, [details, item.media_type, item.poster_path, tvdbDetails]);

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
                {isNew && <NewReleaseOverlay position="top-left" color="cyan" />}
                {recentEpisodeCount > 0 && (
                    <NewReleaseOverlay
                        text={recentEpisodeCount > 1 ? "NEW EPISODES" : "NEW EPISODE"}
                        position="top-right"
                        color="rose"
                    />
                )}
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
                    <h3 className="text-white text-sm font-bold text-center w-full">{title}</h3>
                </div>
            </div>
        </div>
    );
};

export default ShowCard;
