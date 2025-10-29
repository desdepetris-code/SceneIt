import React, { useState, useEffect, useMemo } from 'react';
import { getMediaDetails, discoverMedia } from '../services/tmdbService';
import { TmdbMedia, UserData, HistoryItem, TrackedItem } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, HeartIcon } from '../components/Icons';
import FallbackImage from '../components/FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import MarkAsWatchedModal from '../components/MarkAsWatchedModal';
import { isNewRelease } from '../utils/formatUtils';
import { NewReleaseOverlay } from '../components/NewReleaseOverlay';

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

const ActionCard: React.FC<{
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    isFavorite: boolean;
}> = ({ item, onSelect, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, isFavorite }) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    
    const posterSrcs = [
        getFullImageUrl(item.poster_path, 'w342'),
    ];

    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date;
    const isNew = isNewRelease(releaseDate);

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenAddToListModal(item);
    };

    const handleMarkWatchedClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkShowAsWatched(item);
    };
    
    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const trackedItem: TrackedItem = {
            id: item.id,
            title: item.title || item.name || 'Untitled',
            media_type: item.media_type,
            poster_path: item.poster_path,
            genre_ids: item.genre_ids,
        };
        onToggleFavoriteShow(trackedItem);
    };

    const handleCalendarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMarkAsWatchedModalState({ isOpen: true, item: item });
    };

    const handleSaveWatchedDate = (data: { date: string; note: string }) => {
        if (markAsWatchedModalState.item) {
            onMarkShowAsWatched(markAsWatchedModalState.item, data.date);
        }
        setMarkAsWatchedModalState({ isOpen: false, item: null });
    };

    return (
        <>
            <MarkAsWatchedModal
                isOpen={markAsWatchedModalState.isOpen}
                onClose={() => setMarkAsWatchedModalState({ isOpen: false, item: null })}
                mediaTitle={markAsWatchedModalState.item?.title || markAsWatchedModalState.item?.name || ''}
                onSave={handleSaveWatchedDate}
            />
            <div className="w-full">
                <div 
                    className="relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
                    onClick={() => onSelect(item.id, item.media_type)}
                >
                    {isNew && <NewReleaseOverlay />}
                    <div className="aspect-[2/3]">
                        <FallbackImage 
                            srcs={posterSrcs}
                            placeholder={PLACEHOLDER_POSTER}
                            noPlaceholder={true}
                            alt={`${title} poster`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                         <h3 className="text-white font-bold text-sm truncate">{title}</h3>
                         {releaseDate && <p className="text-xs text-white/80">{new Date(releaseDate).getFullYear()}</p>}
                    </div>
                </div>
                <div className="w-full mt-2 grid grid-cols-4 gap-1.5">
                    <button onClick={handleFavoriteClick} className={`flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors ${isFavorite ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`} title="Favorite">
                        <HeartIcon filled={isFavorite} className="w-4 h-4" />
                    </button>
                    <button onClick={handleMarkWatchedClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors" title="Mark as Watched">
                        <CheckCircleIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleCalendarClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors" title="Set Watched Date">
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleAddClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors" title="Add to List">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );
};


interface RecommendationCarouselProps {
  title: string;
  items: TmdbMedia[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
}

const RecommendationCarousel: React.FC<RecommendationCarouselProps> = (props) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold text-text-primary px-6 mb-4">{props.title}</h2>
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 px-6">
      {props.items.map(item => {
          const isFavorite = props.favorites.some(fav => fav.id === item.id);
          return (
            <ActionCard 
                key={item.id}
                item={item}
                onSelect={props.onSelectShow}
                onMarkShowAsWatched={props.onMarkShowAsWatched}
                onOpenAddToListModal={props.onOpenAddToListModal}
                onToggleFavoriteShow={props.onToggleFavoriteShow}
                isFavorite={isFavorite}
            />
          );
      })}
    </div>
  </section>
);

interface RecommendationsProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  userData: UserData;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
}

const Recommendations: React.FC<RecommendationsProps> = (props) => {
  const { userData, onSelectShow, onMarkShowAsWatched, onOpenAddToListModal, onToggleFavoriteShow, favorites } = props;
  const { history } = userData;
  const [recommendationSections, setRecommendationSections] = useState<{ source: HistoryItem, recommendations: TmdbMedia[] }[]>([]);
  const [generalRecs, setGeneralRecs] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recentUniqueItems = useMemo(() => {
    const uniqueIds = new Set<number>();
    const result: HistoryItem[] = [];
    for (const item of history) {
      if (!uniqueIds.has(item.id)) {
        uniqueIds.add(item.id);
        result.push(item);
      }
      if (result.length >= 5) break; // Get recommendations for the 5 most recent unique items
    }
    return result;
  }, [history]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      
      if (history.length === 0) {
        // New user with no history: fetch popular items
        try {
          const [movies, tv] = await Promise.all([
            discoverMedia('movie', { sortBy: 'popularity.desc' }),
            discoverMedia('tv', { sortBy: 'popularity.desc' })
          ]);
          const combined = [...movies.slice(0, 10), ...tv.slice(0, 10)];
          setGeneralRecs(combined.sort(() => 0.5 - Math.random()));
        } catch (e) {
          console.error(e);
          setError("Could not load recommendations. Please try again later.");
        } finally {
          setLoading(false);
        }
      } else {
        // Existing user: fetch personalized recommendations
        try {
          const recommendationPromises = recentUniqueItems.map(item =>
            getMediaDetails(item.id, item.media_type).then(details => ({
              source: item,
              recommendations: details.recommendations?.results || []
            }))
          );
          const results = await Promise.all(recommendationPromises);
          setRecommendationSections(results.filter(r => r.recommendations.length > 0));
        } catch (e) {
          console.error(e);
          setError("Could not load recommendations. Please try again later.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();
  }, [history, recentUniqueItems]);

  if (loading) {
    return (
        <div className="animate-fade-in px-6">
            <header className="mb-8">
                <div className="h-8 bg-bg-secondary rounded w-1/2"></div>
                <div className="h-4 bg-bg-secondary rounded w-3/4 mt-3"></div>
            </header>
            <div className="mb-8 animate-pulse">
                <div className="h-6 bg-bg-secondary rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                    {[...Array(7)].map((_, j) => (
                        <div key={j} className="w-full">
                            <div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div>
                            <div className="h-9 bg-bg-secondary rounded-md mt-2"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }
  
  const hasPersonalizedRecs = recommendationSections.length > 0;
  const hasGeneralRecs = generalRecs.length > 0;

  return (
    <div className="animate-fade-in">
      <header className="mb-8 px-6">
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="mt-2 text-text-secondary">
          {hasPersonalizedRecs ? 'Suggestions based on your recent activity.' : "Discover popular shows and movies to get started."}
        </p>
      </header>

      {hasPersonalizedRecs ? (
        recommendationSections.map(({ source, recommendations }) => (
          <RecommendationCarousel
            key={source.id}
            title={`Because you watched ${source.title}`}
            items={recommendations}
            onSelectShow={onSelectShow}
            onMarkShowAsWatched={onMarkShowAsWatched}
            onOpenAddToListModal={onOpenAddToListModal}
            onToggleFavoriteShow={onToggleFavoriteShow}
            favorites={favorites}
          />
        ))
      ) : hasGeneralRecs ? (
         <RecommendationCarousel
          title="Popular on SceneIt"
          items={generalRecs}
          onSelectShow={onSelectShow}
          onMarkShowAsWatched={onMarkShowAsWatched}
          onOpenAddToListModal={onOpenAddToListModal}
          onToggleFavoriteShow={onToggleFavoriteShow}
          favorites={favorites}
        />
      ) : (
         <div className="text-center py-20 px-6">
          <h2 className="text-2xl font-bold text-text-primary mt-8">Start Your Journey!</h2>
          <p className="mt-4 text-text-secondary max-w-md mx-auto">
            Watch a few shows or movies, and this page will fill up with personalized recommendations based on your tastes.
          </p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;