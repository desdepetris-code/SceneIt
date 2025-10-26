import React from 'react';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  mediaTitle: string;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, mediaTitle }) => {
  if (!isOpen) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-2">Watch History</h2>
        <p className="text-text-secondary mb-4 truncate">{mediaTitle}</p>
        
        {history.length > 0 ? (
          <ul className="divide-y divide-bg-secondary max-h-80 overflow-y-auto">
            {history.map(item => (
              <li key={item.timestamp} className="py-2">
                <p className="text-text-primary font-semibold">{item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Watched Movie'}</p>
                <p className="text-sm text-text-secondary">{formatTimestamp(item.timestamp)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary text-center py-8">No watch history available for this item.</p>
        )}
        
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;