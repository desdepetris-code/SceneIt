import React, { useState, useEffect } from 'react';
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, WatchProgress, JournalEntry, TrackedItem, EpisodeTag, Comment } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';
import { CheckCircleIcon, BookOpenIcon, StarIcon, ChevronLeftIcon, PlayCircleIcon, ChevronRightIcon, XMarkIcon, CalendarIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon } from './Icons';
import { LiveWatchMediaInfo } from '../types';
import { formatRuntime, isNewRelease, formatDate } from '../utils/formatUtils';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import CommentModal from './CommentModal';
import { getEpisodeDetails } from '../services/tmdbService';
import EpisodeCastAndCrew from './EpisodeCastAndCrew';

interface User {
  id: string;
  username: string;
  email: string;
}

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
  onSaveComment: (mediaKey: string, text: string) => void;
  comments: Comment[];
  episodeNotes?: Record<number, Record<number, Record<number, string>>>;
  currentUser: User | null;
  timezone: string;
  onSelectPerson: (personId: number) => void;
}

const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = ({
  isOpen, onClose, episode, showDetails, seasonDetails, isWatched, onToggleWatched, onOpenJournal, isFavorited, onToggleFavorite, onStartLiveWatch, onSaveJournal, watchProgress, onNext, onPrevious, onAddWatchHistory, onRate, episodeRating, onSaveComment, comments, episodeNotes = {}, currentUser, timezone, onSelectPerson
}) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isLogWatchModalOpen, setIsLogWatchModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [episodeCredits, setEpisodeCredits] = useState<Episode['credits'] | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const minSwipeDistance = 50;
  
  useEffect(() => {
    let isMounted = true;
    if (isOpen && episode) {
        setIsLoadingCredits(true);
        setEpisodeCredits(null); // Reset on new episode
        getEpisodeDetails(showDetails.id, episode.season_number, episode.episode_number)
            .then(details => {
                if (isMounted) {
                    setEpisodeCredits(details.credits || null);
                }
            })
            .catch(err => {
                console.error("Failed to fetch episode credits", err);
            })
            .finally(() => {
                if (isMounted) setIsLoadingCredits(false);
            });
    }
    return () => { isMounted = false; };
  }, [isOpen, episode, showDetails.id]);

  if (!isOpen || !episode) return null;

  const episodeNote = episodeNotes[showDetails.id]?.[episode.season_number]?.[episode.episode_number];

  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(0);
      setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) onNext();
      else if (isRightSwipe) onPrevious();
      
      setTouchStart(0);
      setTouchEnd(0);
  };
  
  const currentIndex = seasonDetails.episodes.findIndex(e => e.id === episode.id);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= seasonDetails.episodes.length - 1;

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
  
  const handleSaveLogWatch = (data: { date: string, note: string }) => {
    if (!episode) return;
    const trackedItem: TrackedItem = {
        id: showDetails.id,
        title: showDetails.name || 'Untitled',
        media_type: 'tv',
        poster_path: showDetails.poster_path,
        genre_ids: showDetails.genres.map(g => g.id),
    };
    onAddWatchHistory(trackedItem, episode.season_number, episode.episode_number, data.date, data.note, episode.name);
  };

  const season = showDetails.seasons?.find(s => s.season_number === episode.season_number);
  const tag: EpisodeTag | null = getEpisodeTag(episode, season, showDetails, seasonDetails);
  const isNew = isNewRelease(episode.air_date);
  
  const episodeMediaKey = `tv-${showDetails.id}-s${episode.season_number}-e${episode.episode_number}`;
  const existingComment = comments.find(c => c.mediaKey === episodeMediaKey && c.userId === currentUser?.id);

  const stillSrcs = [
      getImageUrl(episode.still_path, 'w500', 'still'),
      getImageUrl(seasonDetails.poster_path, 'w500', 'poster'),
      getImageUrl(showDetails.poster_path, 'w500', 'poster'),
  ];

  return (
    <>
      <MarkAsWatchedModal
        isOpen={isLogWatchModalOpen}
        onClose={() => setIsLogWatchModalOpen(false)}
        mediaTitle={`S${episode.season_number} E${episode.episode_number}: ${episode.name}`}
        onSave={handleSaveLogWatch}
      />
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        mediaTitle={`S${episode.season_number} E${episode.episode_number}: ${episode.name}`}
        initialText={existingComment?.text}
        onSave={(text) => onSaveComment(episodeMediaKey, text)}
      />
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="relative h-48 flex-shrink-0">
              <FallbackImage
                  srcs={stillSrcs}
                  placeholder={PLACEHOLDER_STILL}
                  alt={episode.name}
                  className="w-full h-full object-cover rounded-t-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute top-4 right-16 flex items-center space-x-2">
                {isNew && <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-cyan-500/20 text-cyan-300">New</span>}
                {tag && (
                    <div className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${tag.className}`}>
                        {tag.text}
                    </div>
                )}
              </div>
              <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10"><ChevronLeftIcon className="h-6 w-6" /></button>
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10"><XMarkIcon className="h-6 w-6" /></button>
              <div className="absolute bottom-0 left-0 p-4 flex items-end space-x-3">
                  <img src={getImageUrl(showDetails.poster_path, 'w92')} alt="Show Poster" className="w-12 h-18 object-cover rounded-md border-2 border-white/20"/>
                  <img src={getImageUrl(seasonDetails.poster_path, 'w92')} alt="Season Poster" className="w-12 h-18 object-cover rounded-md border-2 border-white/20"/>
              </div>
          </div>
            <div className="flex-grow relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              {!isFirst && (
                  <button onClick={onPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-backdrop rounded-full text-text-primary z-20 hover:bg-bg-secondary transition-colors">
                      <ChevronLeftIcon className="h-6 w-6" />
                  </button>
              )}
              <div className="absolute inset-0 overflow-y-auto p-6 space-y-4">
                  <div>
                      <p className="text-sm font-semibold text-text-secondary">{showDetails.name} &bull; S{episode.season_number} E{episode.episode_number}</p>
                      <h2 className="text-2xl font-bold text-text-primary">{episode.name}</h2>
                      <div className="flex items-center space-x-2 text-xs text-text-secondary/80 mt-1">
                          <span>{isFuture ? 'Airs:' : 'Aired:'} {formatDate(episode.air_date, timezone)}</span>
                          {episode.runtime && episode.runtime > 0 && <span>&bull;</span>}
                          {episode.runtime && episode.runtime > 0 && <span>{formatRuntime(episode.runtime)}</span>}
                      </div>
                  </div>
                  <p className="text-text-secondary text-sm">{episode.overview || "No description available."}</p>
                  {episodeNote && (
                        <div className="mt-4">
                            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg -rotate-1 transform border border-yellow-300/50 dark:border-yellow-700/50">
                                <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-1 text-sm">My Note</h4>
                                <p className="text-yellow-900 dark:text-yellow-100 whitespace-pre-wrap text-sm">{episodeNote}</p>
                            </div>
                        </div>
                    )}
                  {isLoadingCredits ? (
                      <div className="text-center py-4 text-text-secondary">Loading cast...</div>
                  ) : episodeCredits ? (
                      <EpisodeCastAndCrew credits={episodeCredits} onSelectPerson={(personId) => {
                          onClose(); // Close modal before navigating
                          onSelectPerson(personId);
                      }} />
                  ) : null}
              </div>
              {!isLast && (
                  <button onClick={onNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-backdrop rounded-full text-text-primary z-20 hover:bg-bg-secondary transition-colors">
                      <ChevronRightIcon className="h-6 w-6" />
                  </button>
              )}
          </div>
          <div className="p-4 border-t border-bg-secondary/50 flex flex-wrap justify-center gap-2">
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
                  onClick={handleLiveWatch}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md bg-bg-secondary text-text-primary ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <PlayCircleIcon className="w-5 h-5"/>
                  <span>Live Watch</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={() => setIsLogWatchModalOpen(true)}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md bg-bg-secondary text-text-primary ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <CalendarIcon className="w-5 h-5"/>
                  <span>Log Watch</span>
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
                  <HeartIcon filled={isFavorited} className="w-5 h-5"/>
                  <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>
               <button
                  disabled={isFuture}
                  onClick={onRate}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${episodeRating > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <StarIcon className="w-5 h-5"/>
                  <span>{episodeRating > 0 ? `Rated ${episodeRating}/5` : 'Rate'}</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={() => setIsCommentModalOpen(true)}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${existingComment ? 'bg-blue-500/20 text-blue-400' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5"/>
                  <span>{existingComment ? 'Edit Comment' : 'Add Comment'}</span>
              </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EpisodeDetailModal;