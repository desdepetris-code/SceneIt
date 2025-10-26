import React, { useState, useEffect } from 'react';
import { TmdbMedia, WatchStatus } from '../types';
import { PlusIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_BACKDROP } from '../constants';

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

const CarouselCard: React.FC<{
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onAdd: (item: TmdbMedia, list: WatchStatus) => void;
}> = ({ item, onSelect, onAdd }) => {
    const backdropSrcs = [
        getFullImageUrl(item.backdrop_path, 'w500'),
        getFullImageUrl(item.poster_path, 'w342'),
    ];
    const title = item.title || item.name;
    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAdd(item, 'planToWatch');
    };
    return (
        <div 
            className="w-72 flex-shrink-0 relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
            onClick={() => onSelect(item.id, item.media_type)}
        >
            <div className="aspect-video">
                <FallbackImage 
                    srcs={backdropSrcs}
                    placeholder={PLACEHOLDER_BACKDROP}
                    alt={`${title} backdrop`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                 <h3 className="text-white font-bold text-md truncate">{title}</h3>
            </div>
             <button
                onClick={handleAddClick}
                className="absolute top-2 right-2 p-1.5 bg-backdrop rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-primary-accent transition-all"
                aria-label={`Add ${title} to Plan to Watch`}
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

interface GenericCarouselProps {
  title: string;
  fetcher: () => Promise<TmdbMedia[]>;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onAddItemToList: (item: TmdbMedia, list: WatchStatus) => void;
}

const GenericCarousel: React.FC<GenericCarouselProps> = ({ title, fetcher, onSelectShow, onAddItemToList }) => {
    const [media, setMedia] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const results = await fetcher();
                setMedia(results.slice(0, 10)); // Limit to 10
            } catch (error) {
                console.error(`Failed to fetch for carousel "${title}"`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fetcher, title]);

    if (loading) {
        return (
             <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">{title}</h2>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 animate-pulse space-x-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-72 h-[162px] flex-shrink-0">
                             <div className="w-full h-full bg-bg-secondary rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (media.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">{title}</h2>
            <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4">
                {media.map(item => (
                    <CarouselCard 
                        key={`${item.id}-${item.media_type}`}
                        item={item}
                        onSelect={onSelectShow}
                        onAdd={onAddItemToList}
                    />
                ))}
                <div className="w-4 flex-shrink-0"></div>
            </div>
        </div>
    );
};

export default GenericCarousel;