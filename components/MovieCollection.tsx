import React, { useState, useEffect } from 'react';
import { TmdbCollection, TmdbMedia } from '../types';
import { getCollectionDetails } from '../services/tmdbService';
import MediaCard from './MediaCard';
import Carousel from './Carousel';

interface MovieCollectionProps {
  collectionId: number;
  currentMovieId: number;
  onSelectMovie: (id: number, media_type: 'movie') => void;
}

const MovieCollection: React.FC<MovieCollectionProps> = ({ collectionId, currentMovieId, onSelectMovie }) => {
  const [collection, setCollection] = useState<TmdbCollection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCollectionDetails(collectionId)
      .then(setCollection)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [collectionId]);

  if (loading) return (
      <div className="mb-8 animate-pulse">
        <div className="h-6 bg-bg-secondary rounded w-1/2 mb-4"></div>
        <div className="flex space-x-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="w-48 h-[270px] flex-shrink-0 bg-bg-secondary rounded-lg"></div>
            ))}
        </div>
      </div>
  );
  
  if (!collection || collection.parts.length <= 1) return null;

  // Filter out the current movie and sort by release date
  const otherMovies = collection.parts
    .filter(Boolean) // Prevent crash if API returns null in parts array
    .filter(movie => movie.id !== currentMovieId)
    .sort((a, b) => {
      const dateA = new Date(a.release_date || 0).getTime();
      const dateB = new Date(b.release_date || 0).getTime();
      return dateA - dateB;
    });

    if(otherMovies.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-text-primary mb-4">{collection.name}</h2>
      <Carousel>
        <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
          {otherMovies.map(item => (
            <div key={item.id} className="w-40 sm:w-48 flex-shrink-0">
               <MediaCard item={item} onSelect={onSelectMovie} />
            </div>
          ))}
          <div className="w-4 flex-shrink-0"></div>
        </div>
      </Carousel>
    </section>
  );
};

export default MovieCollection;
