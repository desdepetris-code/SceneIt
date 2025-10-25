import React from 'react';
import { TmdbMedia, TrackedItem } from '../types';

type ListType = 'watching' | 'planToWatch' | 'completed';

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TmdbMedia | null;
  onAddToList: (item: TrackedItem, list: ListType) => void;
}

const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({ isOpen, onClose, item, onAddToList }) => {
  if (!isOpen || !item) return null;

  const handleAdd = (list: ListType) => {
    const trackedItem: TrackedItem = {
      id: item.id,
      title: item.title || item.name || 'Unknown',
      media_type: item.media_type,
      poster_path: item.poster_path,
      genre_ids: item.genre_ids
    };
    onAddToList(trackedItem, list);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-2">Add "{item.title || item.name}"</h2>
        <p className="text-text-secondary mb-4">Add this item to one of your lists:</p>
        <div className="space-y-2">
            <button onClick={() => handleAdd('watching')} className="w-full p-3 rounded-md bg-bg-secondary hover:brightness-125 transition-colors">
              Watching
            </button>
            <button onClick={() => handleAdd('planToWatch')} className="w-full p-3 rounded-md bg-bg-secondary hover:brightness-125 transition-colors">
              Plan to Watch
            </button>
            <button onClick={() => handleAdd('completed')} className="w-full p-3 rounded-md bg-bg-secondary hover:brightness-125 transition-colors">
              Completed
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddToWatchlistModal;