import React from 'react';
import { WatchStatus } from '../types';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  // FIX: Changed ListType to WatchStatus to match the type used in ShowDetail.tsx.
  onUpdateList: (newList: WatchStatus | null) => void;
  currentList: WatchStatus | null;
}

const WatchlistModal: React.FC<WatchlistModalProps> = ({ isOpen, onClose, onUpdateList, currentList }) => {
  if (!isOpen) return null;

  const lists: { id: 'watching' | 'planToWatch' | 'completed', name: string }[] = [
    { id: 'watching', name: 'Watching' },
    { id: 'planToWatch', name: 'Plan to Watch' },
    { id: 'completed', name: 'Completed' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-4">Move to a list...</h2>
        <div className="space-y-2">
          {lists.map(list => (
            <button
              key={list.id}
              onClick={() => onUpdateList(list.id)}
              className={`w-full text-left p-3 rounded-md transition-colors ${currentList === list.id ? 'bg-accent-gradient text-white' : 'bg-bg-secondary hover:brightness-125'}`}
            >
              {list.name}
            </button>
          ))}
          {currentList && (
             <button
              onClick={() => onUpdateList(null)}
              className="w-full text-left p-3 rounded-md transition-colors text-red-500 hover:bg-red-500/10"
            >
              Remove from lists
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistModal;
