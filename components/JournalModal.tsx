import React, { useState, useEffect } from 'react';
import { JournalEntry, TmdbMediaDetails, TmdbSeasonDetails, Episode, WatchProgress } from '../types';
import { getSeasonDetails } from '../services/tmdbService';
import { XMarkIcon } from './Icons';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry | null, seasonNumber: number, episodeNumber: number) => void;
  mediaDetails: TmdbMediaDetails | null;
  initialSeason?: number;
  initialEpisode?: Episode;
  watchProgress: WatchProgress;
}


const moods = ['😊', '😂', '😍', '😢', '🤯', '🤔', '😠', '😴', '🥳', '😡', '🤮', '💔'];

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, onSave, mediaDetails, initialSeason, initialEpisode, watchProgress }) => {
  const [text, setText] = useState('');
  const [mood, setMood] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState<number | undefined>(initialEpisode?.episode_number);
  const [episodesForSeason, setEpisodesForSeason] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (mediaDetails?.media_type === 'tv') {
            const seasonNum = initialSeason ?? mediaDetails.seasons?.find(s => s.season_number > 0)?.season_number ?? 1;
            setSelectedSeason(seasonNum);
            setSelectedEpisode(initialEpisode?.episode_number ?? 1);
        } else {
            // Movie
            const entry = watchProgress[mediaDetails?.id || 0]?.[0]?.[0]?.journal;
            setText(entry?.text || '');
            setMood(entry?.mood || '');
        }
    }
  }, [isOpen, initialSeason, initialEpisode, mediaDetails, watchProgress]);
  
  useEffect(() => {
    if (isOpen && mediaDetails?.media_type === 'tv' && selectedSeason !== undefined) {
      setIsLoadingEpisodes(true);
      getSeasonDetails(mediaDetails.id, selectedSeason)
        .then(data => {
          setEpisodesForSeason(data.episodes);
          if (!data.episodes.some(e => e.episode_number === selectedEpisode)) {
            setSelectedEpisode(1);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingEpisodes(false));
    }
  }, [isOpen, mediaDetails, selectedSeason]);

  useEffect(() => {
    if (mediaDetails?.media_type === 'tv' && selectedSeason !== undefined && selectedEpisode !== undefined) {
      const entry = watchProgress[mediaDetails.id]?.[selectedSeason]?.[selectedEpisode]?.journal;
      setText(entry?.text || '');
      setMood(entry?.mood || '');
    }
  }, [mediaDetails, selectedSeason, selectedEpisode, watchProgress]);


  if (!isOpen || !mediaDetails) return null;

  const handleSave = () => {
    const seasonToSave = mediaDetails.media_type === 'tv' ? selectedSeason! : 0;
    const episodeToSave = mediaDetails.media_type === 'tv' ? selectedEpisode! : 0;
    
    if (!text.trim() && !mood) {
        onSave(null, seasonToSave, episodeToSave);
    } else {
        onSave({ text, mood, timestamp: new Date().toISOString() }, seasonToSave, episodeToSave);
    }
    onClose();
  };

  const currentEpisode = episodesForSeason.find(e => e.episode_number === selectedEpisode);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-text-primary mb-2">My Journal</h2>
        <p className="text-text-secondary mb-1">{mediaDetails.name}</p>
        
        {mediaDetails.media_type === 'tv' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
              <select 
                  value={selectedSeason} 
                  onChange={e => setSelectedSeason(Number(e.target.value))}
                  className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
              >
                  {mediaDetails.seasons?.map(s => <option key={s.id} value={s.season_number}>(Season: {s.season_number})</option>)}
              </select>
              <select 
                  value={selectedEpisode} 
                  onChange={e => setSelectedEpisode(Number(e.target.value))}
                  className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  disabled={isLoadingEpisodes}
              >
                  {isLoadingEpisodes 
                      ? <option>Loading...</option> 
                      : episodesForSeason.map(e => <option key={e.id} value={e.episode_number}>E{e.episode_number}: {e.name}</option>)}
              </select>
          </div>
        )}
        {currentEpisode && <p className="text-sm text-text-secondary mb-4">"{currentEpisode.name}"</p>}


        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add your journal entry..."
          className="w-full h-40 p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
        />

        <div className="my-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">How did it make you feel?</label>
          <div className="grid grid-cols-6 gap-2">
            {moods.map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-3xl p-2 rounded-full transition-transform transform hover:scale-125 ${mood === m ? 'bg-primary-accent/20' : 'bg-transparent'}`}
                aria-label={`Mood: ${m}`}
              >
                {m}
              </button>
            ))}
          </div>
           {mood && (
            <div className="text-center mt-3">
                <button onClick={() => setMood('')} className="text-xs text-text-secondary hover:text-red-500 transition-colors">
                    Remove Mood
                </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
