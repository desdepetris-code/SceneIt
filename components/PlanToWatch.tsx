import React from 'react';
import { TrackedItem, UserData } from '../types';
import ShowCard from './ShowCard';
import Carousel from './Carousel';
import { ChevronRightIcon } from './Icons';

interface PlanToWatchProps {
  items: TrackedItem[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onViewMore?: () => void;
  globalPlaceholders?: UserData['globalPlaceholders'];
}

const PlanToWatch: React.FC<PlanToWatchProps> = ({ items, onSelectShow, onViewMore, globalPlaceholders }) => {
  if (items.length === 0) {
    return null; // Don't show if the list is empty
  }

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4 px-6">
        <h2 className="text-2xl font-bold text-text-primary">🗓️ Plan to Watch</h2>
        {onViewMore && (
          <button onClick={onViewMore} className="text-sm view-more-button flex items-center rounded-full px-3 py-1 transition-colors">
            <span>View More</span> <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
      <Carousel>
        <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
          {items.map(item => (
            <div key={item.id} className="w-40 sm:w-48 flex-shrink-0">
              <ShowCard item={item} onSelect={onSelectShow} globalPlaceholders={globalPlaceholders} />
            </div>
          ))}
          <div className="w-4 flex-shrink-0"></div>
        </div>
      </Carousel>
    </div>
  );
};

export default PlanToWatch;