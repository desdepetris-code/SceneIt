
import React, { useState, useMemo } from 'react';
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, WatchProgress, JournalEntry, TrackedItem, EpisodeTag, Comment, CastMember, CrewMember, Reminder, ReminderType } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';
import { CheckCircleIcon, BookOpenIcon, StarIcon, ChevronLeftIcon, PlayCircleIcon, ChevronRightIcon, XMarkIcon, LogWatchIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, PencilSquareIcon, BellIcon } from './Icons';
import { LiveWatchMediaInfo } from '../types';
import { formatRuntime, isNewRelease } from '../utils/formatUtils';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import ScoreStar from './ScoreStar';
import ReminderOptionsModal from './ReminderOptionsModal';

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
  onNext: () => void;
  onPrevious: () => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  onRate: () => void;
  episodeRating: number;
  onDiscuss: () => void;
  episodeNotes?: Record<number, Record<number, Record<number, string>>>;
  showRatings: boolean;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
}

const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = (props) => {
  const { isOpen, onClose, episode, showDetails, seasonDetails, isWatched, onToggleWatched, onOpenJournal, isFavorited, onToggleFavorite, onStartLiveWatch, reminders, onToggleReminder, watchProgress, onNext, onPrevious, onAddWatchHistory, onRate, episodeRating, onDiscuss, episodeNotes = {}, showRatings } = props;
  const [isLogWatchModalOpen, setIsLogWatchModalOpen] = useState(false);
  const [isReminderOptionsOpen, setIsReminderOptionsOpen] = useState(false);

  const reminderId = useMemo(() => episode ? `rem-tv-${showDetails.id}-s${episode.season_number}-e${episode.episode_number}-ep` : '', [episode, showDetails.id]);
  const isReminderSet = useMemo(() => reminders.some(r => r.id === reminderId), [reminders, reminderId]);

  const ageRating = useMemo(() => {
    if (!showDetails) return null;
    const usRating = showDetails.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
    return usRating?.rating || null;
  }, [showDetails]);

  const getAgeRatingColor = (rating: string) => {
    const r = rating.toUpperCase();
    if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
    if (r === 'TV-Y') return 'bg-[#008000] text-white';
    if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black';
    if (r === 'PG-13') return 'bg-[#00008B] text-white';
    if (r === 'TV-14') return 'bg-[#800000] text-white';
    if (r === 'R') return 'bg-[#FF00FF] text-black font-black';
    if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-md';
    return 'bg-stone-500 text-white';
  };

  const handleLiveWatch = () => {
    if (!episode) return;
    const mediaInfo: LiveWatchMediaInfo = {
      id: showDetails.id,
      media_type: 'tv',
      title: showDetails.name!,
      poster_path: showDetails.poster_path!,
      runtime: showDetails.episode_run_time?.[0] || 45,
      seasonNumber: episode.season_number,
      episodeNumber: episode.episode_number,
      episodeTitle: episode.name,
    };
    onStartLiveWatch(mediaInfo);
  };

  if (!isOpen || !episode) return null;

  const today = new Date().toISOString().split('T')[0];
  const isFuture = (episode.air_date && episode.air_date > today) || !episode.air_date;

  const handleReminderToggle = (type: ReminderType | null) => {
      const newReminder: Reminder | null = type ? {
          id: reminderId, mediaId: showDetails.id, mediaType: 'tv', releaseDate: episode.air_date || 'TBD',
          title: showDetails.name || 'Untitled', poster_path: showDetails.poster_path,
          episodeInfo: `S${episode.season_number} E${episode.episode_number}: ${episode.name}`, 
          seasonNumber: episode.season_number, episodeNumber: episode.episode_number,
          reminderType: type, wasDateUnknown: !episode.air_date
      } : null;
      onToggleReminder(newReminder, reminderId);
      setIsReminderOptionsOpen(false);
  };

  return (
    <>
      <MarkAsWatchedModal isOpen={isLogWatchModalOpen} onClose={() => setIsLogWatchModalOpen(false)} mediaTitle={`S${episode.season_number} E${episode.episode_number}: ${episode.name}`} onSave={(d) => onAddWatchHistory({id: showDetails.id, title: showDetails.name!, media_type: 'tv', poster_path: showDetails.poster_path}, episode.season_number, episode.episode_number, d.date, d.note, episode.name)} />
      <ReminderOptionsModal isOpen={isReminderOptionsOpen} onClose={() => setIsReminderOptionsOpen(false)} onSelect={handleReminderToggle} />
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="relative h-48 flex-shrink-0">
              <FallbackImage srcs={[getImageUrl(episode.still_path, 'w500', 'still'), getImageUrl(seasonDetails.poster_path, 'w500', 'poster'), getImageUrl(showDetails.poster_path, 'w500', 'poster')]} placeholder={PLACEHOLDER_STILL} alt={episode.name} className="w-full h-full object-cover rounded-t-lg" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10"><ChevronLeftIcon className="h-6 w-6" /></button>
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10"><XMarkIcon className="h-6 w-6" /></button>
          </div>
            <div className="flex-grow relative overflow-y-auto p-6 space-y-4">
                  <div>
                      <p className="text-sm font-semibold text-text-secondary">{showDetails.name} &bull; S{episode.season_number} E{episode.episode_number}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <h2 className="text-2xl font-bold text-text-primary">{episode.name}</h2>
                        {showRatings && episode.vote_average > 0 && <ScoreStar score={episode.vote_average} size="sm" />}
                      </div>
                      <div className="flex items-center flex-wrap gap-2 text-xs text-text-secondary/80 mt-1">
                          <span>{isFuture ? (episode.air_date ? 'Airs: ' : 'TBA: ') : 'Aired: '}{episode.air_date ? new Date(episode.air_date + 'T00:00:00').toLocaleDateString() : 'TBD'}</span>
                          {ageRating && <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border border-white/10 ${getAgeRatingColor(ageRating)}`}>{ageRating}</span>}
                      </div>
                  </div>
                  <p className="text-text-secondary text-sm">{episode.overview || "No description available."}</p>
            </div>
          <div className="p-4 border-t border-primary-accent/10 flex flex-wrap justify-center gap-2">
              {isFuture && (
                  <button onClick={() => isReminderSet ? handleReminderToggle(null) : setIsReminderOptionsOpen(true)} className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 transition-colors ${isReminderSet ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-primary'}`}>
                      <BellIcon filled={isReminderSet} className="w-5 h-5"/>
                      <span>{isReminderSet ? 'Reminder Set' : 'Remind Me'}</span>
                  </button>
              )}
              <button disabled={isFuture} onClick={onToggleWatched} className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 transition-colors ${isWatched ? 'bg-green-500/20 text-green-400' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}><CheckCircleIcon className="w-5 h-5"/><span>{isWatched ? 'Not Watched' : 'Watch'}</span></button>
              <button disabled={isFuture} onClick={handleLiveWatch} className="flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 bg-bg-secondary text-text-primary disabled:opacity-50"><PlayCircleIcon className="w-5 h-5"/><span>Live Watch</span></button>
              <button disabled={isFuture} onClick={() => setIsLogWatchModalOpen(true)} className="flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 bg-bg-secondary text-text-primary disabled:opacity-50"><LogWatchIcon className="w-5 h-5"/><span>Log Watch</span></button>
              <button onClick={onOpenJournal} className="flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 bg-bg-secondary text-text-primary"><BookOpenIcon className="w-5 h-5"/><span>Journal</span></button>
              <button onClick={onToggleFavorite} className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 transition-colors ${isFavorited ? 'bg-yellow-500/20 text-yellow-400' : 'bg-bg-secondary text-text-primary'}`}><HeartIcon filled={isFavorited} className="w-5 h-5"/><span>{isFavorited ? 'Favorited' : 'Favorite'}</span></button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EpisodeDetailModal;
