import React, { useState, useEffect, useCallback, useRef } from 'react';
import { discoverMediaPaginated } from '../services/tmdbService';
import { TmdbMedia, TrackedItem } from '../types';
import { ChevronLeftIcon } from '../components/Icons';
import ActionCard from '../components/ActionCard';
import GenreFilter from '../components/GenreFilter';

interface AllMediaScreenProps {
  onBack: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  title: string;
  initialMediaType: 'tv' | 'movie';
  initialGenreId: number | string | null | { movie?: number | string; tv?: number | string; };
  initialSortBy: string;
  voteCountGte: number;
  voteCountLte?: number;
  showMediaTypeToggle: boolean;
  genres: Record<number, string>;
  showRatings: boolean;
}

const AllMediaScreen: React.FC<AllMediaScreenProps> = (props) => {
    const { onBack, onSelectShow, favorites, completed, title, initialMediaType, initialGenreId, initialSortBy, voteCountGte, voteCountLte, showMediaTypeToggle, genres, showRatings } = props;
    
    const [media, setMedia] = useState<TmdbMedia[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [mediaType, setMediaType] = useState(initialMediaType);
    const [genreId, setGenreId] = useState<number | string | null>(
        typeof initialGenreId === 'object' && initialGenreId !== null ? initialGenreId[initialMediaType] ?? null : initialGenreId
    );

    const loaderRef = useRef(null);
    const resetRef = useRef(false);

    const loadMoreMedia = useCallback(async (isReset = false) => {
        if (loading || (!hasMore && !isReset)) return;
        setLoading(true);

        const currentPage = isReset ? 1 : page;

        try {
            const data = await discoverMediaPaginated(mediaType, {
                page: currentPage,
                genre: genreId || undefined,
                sortBy: initialSortBy,
                vote_count_gte: voteCountGte,
                vote_count_lte: voteCountLte,
            });
            
            if (isReset) {
                setMedia(data.results);
            } else {
                setMedia(prev => [...prev, ...data.results]);
            }
            
            setPage(currentPage + 1);
            setHasMore(currentPage < data.total_pages);
        } catch (error) {
            console.error("Failed to load media:", error);
        } finally {
            setLoading(false);
        }
    }, [page, loading, hasMore, mediaType, genreId, initialSortBy, voteCountGte, voteCountLte]);
    
    useEffect(() => {
        if (typeof initialGenreId === 'object' && initialGenreId !== null) {
            setGenreId(initialGenreId[mediaType] ?? null);
        }
        resetRef.current = true;
    }, [mediaType, initialGenreId]);

    useEffect(() => {
        if (resetRef.current) {
            setMedia([]);
            setPage(1);
            setHasMore(true);
            loadMoreMedia(true);
            resetRef.current = false;
        }
    }, [mediaType, genreId, loadMoreMedia]);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                loadMoreMedia(false);
            }
        }, { rootMargin: '400px' });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }
        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loadMoreMedia]);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-8">
            <header className="flex items-center mb-6 relative">
                <button onClick={onBack} className="absolute left-0 p-2 bg-backdrop rounded-full text-text-primary">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold text-text-primary text-center w-full">{title}</h1>
            </header>
            
            <div className="mb-6 space-y-4">
                {showMediaTypeToggle && (
                    <div className="flex justify-center">
                        <div className="flex p-1 bg-bg-secondary rounded-full">
                            <button onClick={() => setMediaType('movie')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${mediaType === 'movie' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>Movies</button>
                            <button onClick={() => setMediaType('tv')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${mediaType === 'tv' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>TV Shows</button>
                        </div>
                    </div>
                )}
                <GenreFilter genres={genres} selectedGenreId={typeof genreId === 'number' ? genreId : null} onSelectGenre={(id) => setGenreId(id)} />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {media.map(item => (
                    <ActionCard 
                        key={`${item.id}-${item.media_type}`} 
                        item={item} 
                        onSelect={onSelectShow}
                        onOpenAddToListModal={props.onOpenAddToListModal}
                        onMarkShowAsWatched={props.onMarkShowAsWatched}
                        onToggleFavoriteShow={props.onToggleFavoriteShow}
                        isFavorite={favorites.some(f => f.id === item.id)}
                        isCompleted={completed.some(c => c.id === item.id)}
                        showRatings={showRatings}
                    />
                ))}
            </div>

            <div ref={loaderRef} className="h-20 flex justify-center items-center">
                {loading && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent"></div>
                )}
                {!hasMore && media.length > 0 && (
                    <p className="text-text-secondary">You've reached the end of the list.</p>
                )}
            </div>
        </div>
    );
};

export default AllMediaScreen;