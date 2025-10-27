import React from 'react';
import { TmdbMedia, TrackedItem } from '../types';
import { discoverMedia, getUpcomingMovies } from '../services/tmdbService';
import NewSeasons from '../components/NewSeasons';
import NewReleases from '../components/NewReleases';
import TrendingSection from '../components/TrendingSection';
import GenericCarousel from '../components/GenericCarousel';

interface DiscoverScreenProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  // FIX: Added missing props required by child components.
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
}

const DiscoverScreen: React.FC<DiscoverScreenProps> = ({ onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, completed }) => {
  return (
    <div className="animate-fade-in space-y-8">
      <header className="px-6">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="mt-1 text-text-secondary">Find new shows and movies to watch.</p>
      </header>
      <NewSeasons onSelectShow={onSelectShow} trackedShows={[]} />
      <NewReleases mediaType="movie" title="🍿 New Movie Releases" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={completed} />
      <TrendingSection mediaType="tv" title="🔥 Trending TV Shows" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={completed} />
      <TrendingSection mediaType="movie" title="🔥 Trending Movies" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={completed} />
      <GenericCarousel title="✨ Popular Movies" fetcher={() => discoverMedia('movie', { sortBy: 'popularity.desc' })} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={completed} />
      <GenericCarousel title="🌟 Top Rated TV Shows" fetcher={() => discoverMedia('tv', { sortBy: 'vote_average.desc', vote_count_gte: 200 })} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={completed} />
      <GenericCarousel title="📅 Upcoming Movies" fetcher={getUpcomingMovies} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={completed} />
    </div>
  );
};

export default DiscoverScreen;
