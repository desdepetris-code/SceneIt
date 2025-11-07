import React, { useState, useEffect } from 'react';
import { getTrending, discoverMedia } from '../services/tmdbService';
import { TmdbMedia, TrackedItem } from '../types';
import { ChevronLeftIcon } from '../components/Icons';
import ActionCard from '../components/ActionCard';

interface AllTrendingTVShowsScreenProps {
  onBack: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  showRatings: boolean;
}

const AllTrendingTVShowsScreen: React.FC<AllTrendingTVShowsScreenProps> = (props) => {
    const { onBack, onSelectShow, favorites, completed, showRatings } = props;
    const [shows, setShows] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllShows = async () => {
            setLoading(true);
            try {
                const [trending, popular, topRated] = await Promise.all([
                    getTrending('tv'),
                    discoverMedia('tv', { sortBy: 'popularity.desc' }),
                    discoverMedia('tv', { sortBy: 'vote_average.desc', vote_count_gte: 200 })
                ]);
                
                const combined = new Map<number, TmdbMedia>();
                [...trending, ...popular, ...topRated].forEach(item => {
                    if (item.media_type === 'tv') { // Ensure only tv shows are added
                        combined.set(item.id, item);
                    }
                });

                const sortedShows = Array.from(combined.values()).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

                setShows(sortedShows);
            } catch (error) {
                console.error("Failed to load trending & popular TV shows:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllShows();
    }, []);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-8">
            <header className="flex items-center mb-6 relative">
                <button onClick={onBack} className="absolute left-0 p-2 bg-backdrop rounded-full text-text-primary">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold text-text-primary text-center w-full">Trending & Popular TV Shows</h1>
            </header>
            
            {loading ? (
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 animate-pulse">
                    {[...Array(21)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div><div className="h-9 bg-bg-secondary rounded-md mt-2"></div></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                    {shows.map(show => (
                        <ActionCard 
                            key={show.id} 
                            item={show} 
                            onSelect={onSelectShow}
                            onOpenAddToListModal={props.onOpenAddToListModal}
                            onMarkShowAsWatched={props.onMarkShowAsWatched}
                            onToggleFavoriteShow={props.onToggleFavoriteShow}
                            isFavorite={favorites.some(f => f.id === show.id)}
                            isCompleted={completed.some(c => c.id === show.id)}
                            showRatings={showRatings}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllTrendingTVShowsScreen;