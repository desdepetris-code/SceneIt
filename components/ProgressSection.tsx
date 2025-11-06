import React from 'react';
import { TrackedItem, WatchProgress } from '../types';
import ProgressItem from './ProgressItem';

interface ProgressSectionProps {
  items: TrackedItem[];
  watchProgress: WatchProgress;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const ProgressSection: React.FC<ProgressSectionProps> = ({ items, watchProgress, onSelect }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-primary mb-2 px-6">Progress</h2>
      <div className="flex overflow-x-auto py-2 -mx-2 px-6">
        {items.map(item => (
          <ProgressItem
            key={item.id}
            item={item}
            watchProgress={watchProgress}
            onSelect={onSelect}
          />
        ))}
        <div className="flex-shrink-0 w-2"></div>
      </div>
    </div>
  );
};

export default ProgressSection;