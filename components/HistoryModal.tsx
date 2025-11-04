import React, { useState, useEffect } from 'react';
import { HistoryItem, TmdbMediaDetails } from '../types';
import { TrashIcon, XMarkIcon, CheckCircleIcon } from './Icons';
import { confirmationService } from '../services/confirmationService';
import { getImageUrl } from '../utils/imageUtils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  mediaTitle: string;
  onDeleteHistoryItem?: (item: HistoryItem) => void;
  onClearMediaHistory?: (mediaId: number, mediaType: 'tv' | 'movie') => void;
  mediaDetails: TmdbMediaDetails | null;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, mediaTitle, onDeleteHistoryItem, onClearMediaHistory, mediaDetails }) => {

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };
  
  const releaseDate = mediaDetails?.release_date || mediaDetails?.first_air_date;

  const handleClearAll = () => {
    if (mediaDetails && onClearMediaHistory) {
      const mediaTypeString = mediaDetails.media_type === 'tv' ? 'this TV show' : 'this movie';
      const progressResetMessage = mediaDetails.media_type === 'tv' ? ' and reset all watch progress' : '';
      const message = `This will permanently delete all ${history.length} watch record(s) for ${mediaTypeString} ("${mediaTitle}")${progressResetMessage}. Are you sure?`;
      
      if (window.confirm(message)) {
        onClearMediaHistory(mediaDetails.id, mediaDetails.media_type);
        confirmationService.show(`All history for "${mediaTitle}" has been cleared.`);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-3xl h-[85vh] flex flex-col p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <div className="flex-shrink-0">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Watch History</h2>
            <p className="text-text-secondary mb-4 truncate">{mediaTitle}</p>
        </div>
        
        <div className="flex-grow my-4 overflow-y-auto pr-2">
            {history.length > 0 ? (
              <ul className="divide-y divide-bg-secondary">
                {history.map(item => (
                  <li key={item.logId} className="py-3 flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-grow min-w-0">
                        <img 
                            src={getImageUrl(item.poster_path, 'w92')} 
                            alt={item.title} 
                            className="w-12 h-18 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex-grow min-w-0">
                            <p className="text-text-primary font-semibold">{item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Watched Movie'}</p>
                             <div className="text-xs text-text-secondary/80 mt-1 space-y-0.5">
                                <p><span className="font-semibold">User Watch Date:</span> {formatTimestamp(item.timestamp)}</p>
                                {releaseDate && <p><span className="font-semibold">Release Date:</span> {new Date(releaseDate + 'T00:00:00').toLocaleDateString()}</p>}
                            </div>
                            {item.note && <p className="text-sm text-text-secondary italic mt-2 p-2 bg-bg-secondary/30 rounded-md whitespace-pre-wrap">"{item.note}"</p>}
                        </div>
                    </div>
                    {onDeleteHistoryItem && (
                        <button
                            onClick={() => onDeleteHistoryItem(item)}
                            className="ml-4 p-2 rounded-full text-text-secondary/70 hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0"
                            aria-label="Delete history item"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-text-secondary text-center py-8">
                        No watch history available for this item.
                    </p>
                </div>
            )}
        </div>
        
        <div className="flex justify-between items-center mt-4 flex-shrink-0">
            {history.length > 0 && onClearMediaHistory ? (
                <button onClick={handleClearAll} className="px-6 py-2 rounded-md text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors font-semibold">
                    Clear All History
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
