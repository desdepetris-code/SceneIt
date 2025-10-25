import React from 'react';
import { HistoryItem } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { ChevronLeftIcon } from '../components/Icons';

interface HistoryScreenProps {
  history: HistoryItem[];
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onSelectShow, onBack }) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
      <header className="flex items-center mb-6 relative">
        <button onClick={onBack} className="absolute left-0 p-2 bg-backdrop rounded-full text-text-primary">
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-text-primary text-center w-full">Watch History</h1>
      </header>
      
      <div className="bg-card-gradient rounded-lg shadow-md">
        {history.length > 0 ? (
          <div className="space-y-1">
            {history
              .filter(item => item.timestamp && !isNaN(new Date(item.timestamp).getTime()))
              .map(item => (
              <div 
                key={item.timestamp} 
                onClick={() => onSelectShow(item.id, item.media_type)} 
                className="flex items-center p-3 border-b border-bg-secondary last:border-b-0 cursor-pointer hover:bg-bg-secondary/50 rounded-lg"
              >
                <img src={getImageUrl(item.poster_path, 'w92')} alt={item.title} className="w-10 h-15 rounded-md"/>
                <div className="ml-4 flex-grow min-w-0">
                  <p className="font-semibold text-text-primary truncate">{item.title}</p>
                  <p className="text-sm text-text-secondary">
                    {item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Movie'}
                  </p>
                </div>
                <p className="text-sm text-text-secondary flex-shrink-0">
                  {new Date(String(item.timestamp)).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-center text-text-secondary">No watch history yet. Get watching!</p>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;