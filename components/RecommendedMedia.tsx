import React from 'react';
import { TmdbMedia } from '../types';
import MediaCard from './MediaCard';
import Carousel from './Carousel';

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
      <Carousel>
        <div className="grid grid-flow-col auto-cols-[calc(50%-0.5rem)] sm:auto-cols-[calc(33.33%-0.66rem)] md:auto-cols-[calc(25%-0.75rem)] lg:auto-cols-[calc(20%-0.8rem)] xl:auto-cols-[calc(16.66%-0.83rem)] gap-4 overflow-x-auto hide-scrollbar pb-2">
          {recommendations.slice(0, 15).map(item => ( // Show up to 15 recommendations
            <MediaCard key={item.id} item={item} onSelect={onSelectShow} />
          ))}
        </div>
      </Carousel>
    </div>
  );
};

export default RecommendedMedia;