import React, { useState, useEffect } from 'react';
import { getTrending, discoverMedia } from '../services/tmdbService';
import { TmdbMedia, TrackedItem } from '../types';
import { ChevronLeftIcon } from '../components/Icons';
import ActionCard from '../components/ActionCard';

interface AllTrendingMoviesScreenProps {
  onBack: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  showRatings: boolean;
}

const AllTrendingMoviesScreen: React.FC<AllTrendingMoviesScreenProps> = (props) => {
    const { onBack, onSelectShow, favorites, completed, showRatings } = props;
    const [movies, setMovies] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllMovies = async () => {
            setLoading(true);
            try {
                const [trending, popular, topRated] = await Promise.all([
                    getTrending('movie'),
                    discoverMedia('movie', { sortBy: 'popularity.desc' }),
                    discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 300 })
                ]);
                
                const combined = new Map<number, TmdbMedia>();
                 [...trending, ...popular, ...topRated].forEach(item => {
                    if (item.media_type === 'movie') { // Ensure only movies are added
                        combined.set(item.id, item);
                    }
                });

                const sortedMovies = Array.from(combined.values()).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

                setMovies(sortedMovies);
            } catch (error) {
                console.error("Failed to load trending & popular movies:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllMovies();
    }, []);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-8">
            <header className="flex items-center mb-6 relative">
                <button onClick={onBack} className="absolute left-0 p-2 bg-backdrop rounded-full text-text-primary">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold text-text-primary text-center w-full">Trending & Popular Movies</h1>
            </header>
            
            {loading ? (
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 animate-pulse">
                    {[...Array(21)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div><div className="h-9 bg-bg-secondary rounded-md mt-2"></div></div>)}
                </div>
            ) : (
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
            )}
        </div>
    );
};

export default AllTrendingMoviesScreen;