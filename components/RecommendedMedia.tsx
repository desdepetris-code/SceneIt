import React from 'react';
import { TmdbMedia } from '../types';
import MediaCard from './MediaCard';

interface RecommendedMediaProps {
  recommendations: TmdbMedia[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const RecommendedMedia: React.FC<RecommendedMediaProps> = ({ recommendations, onSelectShow }) => {
  if (!recommendations || recommendations.length === 0) {
    return <p className="text-text-secondary">No recommendations available at this time.</p>;
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-text-primary mb-4">You May Also Like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recommendations.map(item => (
          <MediaCard key={item.id} item={item} onSelect={onSelectShow} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedMedia;