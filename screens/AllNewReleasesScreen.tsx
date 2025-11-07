import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAllNewReleasesPaginated } from '../services/tmdbService';
import { TmdbMedia, TrackedItem } from '../types';
import { ChevronLeftIcon } from '../components/Icons';
import ActionCard from '../components/ActionCard';

interface AllNewReleasesScreenProps {
  onBack: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  showRatings: boolean;
}

const AllNewReleasesScreen: React.FC<AllNewReleasesScreenProps> = (props) => {
    const { onBack, onSelectShow, favorites, completed, showRatings } = props;
    const [movies, setMovies] = useState<TmdbMedia[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef(null);
    const initialLoadRef = useRef(true);

    const loadMoreMovies = useCallback(async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const data = await getAllNewReleasesPaginated(page);
            setMovies(prev => [...prev, ...data.results]);
            setPage(prev => prev + 1);
            setHasMore(page < data.total_pages);
        } catch (error) {
            console.error("Failed to load new releases:", error);
        } finally {
            setLoading(false);
        }
    }, [page, loading, hasMore]);
    
    useEffect(() => {
        if (initialLoadRef.current) {
            loadMoreMovies();
            initialLoadRef.current = false;
        }
    }, [loadMoreMovies]);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !initialLoadRef.current) {
                loadMoreMovies();
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
    }, [loadMoreMovies]);


    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-8">
            <header className="flex items-center mb-6 relative">
                <button onClick={onBack} className="absolute left-0 p-2 bg-backdrop rounded-full text-text-primary">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold text-text-primary text-center w-full">All New Movie Releases</h1>
            </header>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {movies.map(movie => (
                    <ActionCard 
                        key={movie.id} 
                        item={movie} 
                        onSelect={onSelectShow}
                        onOpenAddToListModal={props.onOpenAddToListModal}
                        onMarkShowAsWatched={props.onMarkShowAsWatched}
                        onToggleFavoriteShow={props.onToggleFavoriteShow}
                        isFavorite={favorites.some(f => f.id === movie.id)}
                        isCompleted={completed.some(c => c.id === movie.id)}
                        showRatings={showRatings}
                    />
                ))}
            </div>

            <div ref={loaderRef} className="h-20 flex justify-center items-center">
                {loading && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent"></div>
                )}
                {!hasMore && movies.length > 0 && (
                    <p className="text-text-secondary">You've reached the end of the list.</p>
                )}
            </div>
        </div>
    );
};

export default AllNewReleasesScreen;