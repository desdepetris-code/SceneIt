import React from 'react';
import { TrackedItem } from '../types';
import ShowCard from './ShowCard';

interface PlanToWatchProps {
  items: TrackedItem[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const PlanToWatch: React.FC<PlanToWatchProps> = ({ items, onSelectShow }) => {
  if (items.length === 0) {
    return null; // Don't show if the list is empty
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">🗓️ Plan to Watch</h2>
      <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4">
        {items.map(item => (
          <div key={item.id} className="w-40 sm:w-48 flex-shrink-0">
            <ShowCard item={item} onSelect={onSelectShow} />
          </div>
        ))}
        <div className="w-4 flex-shrink-0"></div>
      </div>
    </div>
  );
};

export default PlanToWatch;