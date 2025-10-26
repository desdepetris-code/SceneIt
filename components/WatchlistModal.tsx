import React from 'react';
import { WatchStatus, CustomList } from '../types';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateList: (newListId: string | null) => void;
  currentList: WatchStatus | null;
  customLists: CustomList[];
}

const WatchlistModal: React.FC<WatchlistModalProps> = ({ isOpen, onClose, onUpdateList, currentList, customLists }) => {
  if (!isOpen) return null;

  const lists: { id: WatchStatus, name: string }[] = [
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
              className={`w-full text-left p-3 rounded-md transition-colors ${currentList === list.id ? 'bg-accent-gradient text-on-accent font-semibold' : 'bg-bg-secondary hover:brightness-125'}`}
            >
              {list.name}
            </button>
          ))}
          
          {customLists.length > 0 && (
            <>
              <div className="my-3 border-t border-bg-secondary"></div>
              <h3 className="text-sm font-semibold text-text-secondary mb-2 px-1">Your Lists</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                  {customLists.map(list => (
                      <button key={list.id} onClick={() => onUpdateList(list.id)} className="w-full text-left p-3 rounded-md bg-bg-secondary hover:brightness-125 transition-colors">
                          {list.name}
                      </button>
                  ))}
              </div>
            </>
          )}

          {currentList && (
             <button
              onClick={() => onUpdateList(null)}
              className="w-full text-left p-3 rounded-md transition-colors text-red-500 hover:bg-red-500/10 mt-2"
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