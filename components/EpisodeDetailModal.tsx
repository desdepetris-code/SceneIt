import React, { useState } from 'react';
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, WatchProgress, JournalEntry } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';
import { CheckCircleIcon, BookOpenIcon, StarIcon, ChevronLeftIcon, PlayCircleIcon } from './Icons';
import { LiveWatchMediaInfo } from '../types';
import MoodSelectorModal from './MoodSelectorModal';
import { formatRuntime } from '../utils/formatUtils';

interface EpisodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: Episode | null;
  showDetails: TmdbMediaDetails;
  seasonDetails: TmdbSeasonDetails;
  isWatched: boolean;
  onToggleWatched: () => void;
  onOpenJournal: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onSaveJournal: (showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry) => void;
  watchProgress: WatchProgress;
}

const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = ({
  isOpen, onClose, episode, showDetails, seasonDetails, isWatched, onToggleWatched, onOpenJournal, isFavorited, onToggleFavorite, onStartLiveWatch, onSaveJournal, watchProgress
}) => {
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);

  if (!isOpen || !episode) return null;

  const today = new Date().toISOString().split('T')[0];
  const isFuture = episode.air_date && episode.air_date > today;

  const handleLiveWatch = () => {
    const mediaInfo: LiveWatchMediaInfo = {
        id: showDetails.id,
        media_type: 'tv',
        title: showDetails.name || 'Show',
        poster_path: showDetails.poster_path,
        runtime: showDetails.episode_run_time?.[0] || 45,
        seasonNumber: episode.season_number,
        episodeNumber: episode.episode_number,
        episodeTitle: episode.name,
    };
    onStartLiveWatch(mediaInfo);
    onClose();
  };
  
  const handleSaveMood = (mood: string) => {
    if (!episode) return;
    const existingJournal = watchProgress[showDetails.id]?.[episode.season_number]?.[episode.episode_number]?.journal;
    const newEntry: JournalEntry = {
        text: existingJournal?.text || '',
        mood: mood,
        timestamp: new Date().toISOString()
    };
    onSaveJournal(showDetails.id, episode.season_number, episode.episode_number, newEntry);
    setIsMoodModalOpen(false);
  };

  const currentMood = watchProgress[showDetails.id]?.[episode.season_number]?.[episode.episode_number]?.journal?.mood;

  return (
    <>
      <MoodSelectorModal isOpen={isMoodModalOpen} onClose={() => setIsMoodModalOpen(false)} onSelectMood={handleSaveMood} currentMood={currentMood} />
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="relative h-48 flex-shrink-0">
              {episode.still_path ? (
                  <img 
                      src={getImageUrl(episode.still_path, 'w500', 'still')}
                      alt={episode.name}
                      className="w-full h-full object-cover rounded-t-lg"
                  />
              ) : (
                  <div className="w-full h-full bg-bg-secondary rounded-t-lg" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10"><ChevronLeftIcon className="h-6 w-6" /></button>
              <div className="absolute bottom-0 left-0 p-4 flex items-end space-x-3">
                  <img src={getImageUrl(showDetails.poster_path, 'w92')} alt="Show Poster" className="w-12 h-18 object-cover rounded-md border-2 border-white/20"/>
                  <img src={getImageUrl(seasonDetails.poster_path, 'w92')} alt="Season Poster" className="w-12 h-18 object-cover rounded-md border-2 border-white/20"/>
              </div>
          </div>

          <div className="p-6 flex-grow overflow-y-auto space-y-4">
              <div>
                  <p className="text-sm text-text-secondary">{showDetails.name} &bull; S{episode.season_number} E{episode.episode_number}</p>
                  <h2 className="text-2xl font-bold text-text-primary">{episode.name}</h2>
                   <div className="flex items-center space-x-2 text-xs text-text-secondary/80 mt-1">
                        {episode.air_date && <span>Aired: {new Date(episode.air_date + 'T00:00:00').toLocaleDateString()}</span>}
                        {episode.runtime && episode.runtime > 0 && episode.air_date && <span>&bull;</span>}
                        {episode.runtime && episode.runtime > 0 && <span>{formatRuntime(episode.runtime)}</span>}
                    </div>
              </div>
              <p className="text-text-secondary text-sm">{episode.overview || "No description available."}</p>
          </div>

          <div className="p-4 border-t border-bg-secondary/50 flex flex-wrap justify-center gap-2">
              <button
                  disabled={isFuture}
                  onClick={handleLiveWatch}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md bg-accent-gradient text-on-accent ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90 transition-opacity'}`}
              >
                  <PlayCircleIcon className="w-5 h-5"/>
                  <span>Live Watch</span>
              </button>
            <button
                  disabled={isFuture}
                  onClick={onToggleWatched}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${isWatched ? 'bg-green-500/20 text-green-400' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <CheckCircleIcon className="w-5 h-5"/>
                  <span>{isWatched ? 'Watched' : 'Mark Watched'}</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={() => setIsMoodModalOpen(true)}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${currentMood ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <span className="text-xl">{currentMood || '😶'}</span>
                  <span>Mood</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={onOpenJournal}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md bg-bg-secondary text-text-primary ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <BookOpenIcon className="w-5 h-5"/>
                  <span>Journal</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={onToggleFavorite}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${isFavorited ? 'bg-yellow-500/20 text-yellow-400' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <StarIcon filled={isFavorited} className="w-5 h-5"/>
                  <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EpisodeDetailModal;