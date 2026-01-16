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
      const message = `This will permanently delete the ${history.length} watch log entry(ies) for ${mediaTypeString} ("${mediaTitle}"). Your watched status checkmarks and progress will remain intact. Proceed?`;
      
      if (window.confirm(message)) {
        onClearMediaHistory(mediaDetails.id, mediaDetails.media_type);
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
                {history.map(item => {
                  const imageToUse = item.episodeStillPath || item.seasonPosterPath || item.poster_path;
                  const imageType = item.episodeStillPath ? 'still' : 'poster';
                  
                  return (
                    <li key={item.logId} className="py-4 flex items-start justify-between group">
                      <div className="flex items-start space-x-4 flex-grow min-w-0">
                          <img 
                              src={getImageUrl(imageToUse, 'w92', imageType)} 
                              alt={item.title} 
                              className="w-14 h-20 object-cover rounded-md flex-shrink-0 shadow-md"
                          />
                          <div className="flex-grow min-w-0">
                              <p className="text-text-primary font-bold">{item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Watched Movie'}</p>
                               <div className="text-xs text-text-secondary/80 mt-1 space-y-1">
                                  <p><span className="font-semibold opacity-60">Watch Date:</span> {formatTimestamp(item.timestamp)}</p>
                                  {releaseDate && <p><span className="font-semibold opacity-60">Release:</span> {new Date(releaseDate + 'T00:00:00').toLocaleDateString()}</p>}
                              </div>
                              {item.note && <p className="text-xs text-text-secondary italic mt-2 p-2 bg-bg-secondary/30 rounded-md whitespace-pre-wrap">"{item.note}"</p>}
                          </div>
                      </div>
                      <div className="flex flex-col items-center justify-center h-full ml-4">
                          {onDeleteHistoryItem && (
                              <button
                                  onClick={() => onDeleteHistoryItem(item)}
                                  className="p-2.5 rounded-full text-text-secondary/40 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                                  aria-label="Delete this specific play"
                                  title="Delete this play"
                              >
                                  <TrashIcon className="w-5 h-5" />
                              </button>
                          )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-text-secondary text-center py-8">
                        No watch history available for this item.
                    </p>
                </div>
            )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 flex-shrink-0">
            {history.length > 0 && onClearMediaHistory ? (
                <button 
                  onClick={handleClearAll} 
                  className="w-full sm:w-auto px-6 py-2 rounded-lg border border-primary-accent/40 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs"
                >
                    Clear All Logs
                </button>
            ) : <div className="hidden sm:block"></div>}

            <button onClick={onClose} className="w-full sm:w-auto px-10 py-3 rounded-lg text-white bg-accent-gradient font-black uppercase tracking-widest text-xs hover:opacity-90 shadow-lg">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
