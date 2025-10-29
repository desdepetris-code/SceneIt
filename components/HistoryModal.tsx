import React, { useState, useEffect } from 'react';
import { HistoryItem, TmdbMediaDetails } from '../types';
import { TrashIcon, XMarkIcon, CheckCircleIcon } from './Icons';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  mediaTitle: string;
  onDeleteHistoryItem?: (logId: string) => void;
  onClearMediaHistory?: (mediaId: number, mediaType: 'tv' | 'movie') => void;
  mediaDetails: TmdbMediaDetails | null;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, mediaTitle, onDeleteHistoryItem, onClearMediaHistory, mediaDetails }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    // When the modal is opened, ensure feedback is cleared
    if (isOpen) {
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };
  
  const releaseDate = mediaDetails?.release_date || mediaDetails?.first_air_date;

  const handleClearAll = () => {
    if (mediaDetails && onClearMediaHistory) {
      const message = `This will permanently delete all ${history.length} watch record(s) for "${mediaTitle}" and reset its watch progress. Are you sure?`;
      
      if (window.confirm(message)) {
        onClearMediaHistory(mediaDetails.id, mediaDetails.media_type);
        setFeedback('History for this item has been cleared successfully!');
        
        setTimeout(() => {
            onClose();
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-text-primary mb-2">Watch History</h2>
        <p className="text-text-secondary mb-4 truncate">{mediaTitle}</p>
        
        {feedback && (
          <div className="bg-green-500/20 text-green-300 p-3 rounded-lg mb-4 flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5" />
            <span>{feedback}</span>
          </div>
        )}

        {history.length > 0 ? (
          <ul className="divide-y divide-bg-secondary max-h-80 overflow-y-auto">
            {history.map(item => (
              <li key={item.logId} className="py-3 flex items-start justify-between">
                <div>
                  <p className="text-text-primary font-semibold">{item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Watched Movie'}</p>
                   <div className="text-xs text-text-secondary/80 mt-1 space-y-0.5">
                      <p><span className="font-semibold">User Watch Date:</span> {formatTimestamp(item.timestamp)}</p>
                      {releaseDate && <p><span className="font-semibold">Release Date:</span> {new Date(releaseDate + 'T00:00:00').toLocaleDateString()}</p>}
                  </div>
                  {item.note && <p className="text-sm text-text-secondary italic mt-2 p-2 bg-bg-secondary/30 rounded-md whitespace-pre-wrap">"{item.note}"</p>}
                </div>
                {onDeleteHistoryItem && (
                    <button
                        onClick={() => onDeleteHistoryItem(item.logId)}
                        className="ml-4 p-2 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0"
                        aria-label="Delete history item"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary text-center py-8">
            {feedback ? 'History has been cleared.' : 'No watch history available for this item.'}
          </p>
        )}
        
        <div className="flex justify-between items-center mt-4">
            {history.length > 0 && onClearMediaHistory && !feedback ? (
                <button onClick={handleClearAll} className="px-6 py-2 rounded-md text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors font-semibold">
                    Clear Item History
                </button>
            ) : <div></div>}

            <button onClick={onClose} className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;