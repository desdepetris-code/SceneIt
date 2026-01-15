
import React, { useState, useMemo } from 'react';
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, WatchProgress, JournalEntry, TrackedItem, EpisodeTag, Comment, CastMember, CrewMember } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';
import { CheckCircleIcon, BookOpenIcon, StarIcon, ChevronLeftIcon, PlayCircleIcon, ChevronRightIcon, XMarkIcon, LogWatchIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, PencilSquareIcon } from './Icons';
import { LiveWatchMediaInfo } from '../types';
import { formatRuntime, isNewRelease } from '../utils/formatUtils';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import ScoreStar from './ScoreStar';
import NotesModal from './NotesModal';


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
}

const CrewList: React.FC<{ crew: CrewMember[] }> = ({ crew }) => {
    if (!crew || crew.length === 0) return null;
    return (
        <div>
            <h4 className="font-semibold text-text-primary mt-4 mb-2">Crew</h4>
            <ul className="text-sm text-text-secondary space-y-1">
                {crew.map(member => <li key={member.id}>{member.name} <span className="text-text-secondary/70">({member.job})</span></li>)}
            </ul>
        </div>
    );
};

const GuestStarsList: React.FC<{ stars: CastMember[] }> = ({ stars }) => {
    if (!stars || stars.length === 0) return null;
    return (
        <div>
            <h4 className="font-semibold text-text-primary mt-4 mb-2">Guest Stars</h4>
            <ul className="text-sm text-text-secondary space-y-1">
                {stars.map(star => <li key={star.id}>{star.name} <span className="text-text-secondary/70">as {star.character}</span></li>)}
            </ul>
        </div>
    );
};


const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = ({
  isOpen, onClose, episode, showDetails, seasonDetails, isWatched, onToggleWatched, onOpenJournal, isFavorited, onToggleFavorite, onStartLiveWatch, onSaveJournal, watchProgress, onNext, onPrevious, onAddWatchHistory, onRate, episodeRating, onDiscuss, episodeNotes = {}, showRatings
}) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isLogWatchModalOpen, setIsLogWatchModalOpen] = useState(false);
  const minSwipeDistance = 50;

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
                      <div className="flex items-center space-x-4 mt-1">
                        <h2 className="text-2xl font-bold text-text-primary">{episode.name}</h2>
                        {showRatings && (() => {
                            if (episode.vote_average && episode.vote_average > 0) {
                                return <ScoreStar score={episode.vote_average} voteCount={episode.vote_count} size="sm" />;
                            }
                            if (episode.vote_average === 0) {
                                if (tag?.text?.includes('Premiere')) {
                                    return null;
                                }
                                return <span className="text-md text-text-secondary/70 font-semibold px-2">n/a</span>;
                            }
                            return null;
                        })()}
                      </div>
                      <div className="flex items-center flex-wrap gap-2 text-xs text-text-secondary/80 mt-1">
                          {episode.air_date && <span>Aired: {new Date(episode.air_date + 'T00:00:00').toLocaleDateString()}</span>}
                          {episode.runtime && episode.runtime > 0 && episode.air_date && <span>&bull;</span>}
                          {episode.runtime && episode.runtime > 0 && <span>{formatRuntime(episode.runtime)}</span>}
                          {ageRating && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border border-white/10 ${getAgeRatingColor(ageRating)}`}>
                                    {ageRating}
                                </span>
                          )}
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
                <GuestStarsList stars={episode.guest_stars || []} />
                <CrewList crew={episode.crew || []} />
              </div>
              {!isLast && (
                  <button onClick={onNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-backdrop rounded-full text-text-primary z-20 hover:bg-bg-secondary transition-colors">
                      <ChevronRightIcon className="h-6 w-6" />
                  </button>
              )}
          </div>
          <div className="p-4 border-t border-primary-accent/10 flex flex-wrap justify-center gap-2">
              <button
                  disabled={isFuture}
                  onClick={onToggleWatched}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 transition-colors ${isWatched ? 'bg-green-500/20 text-green-400' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <CheckCircleIcon className="w-5 h-5"/>
                  <span>{isWatched ? 'Not Watched' : 'Watch'}</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={handleLiveWatch}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 bg-bg-secondary text-text-primary ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <PlayCircleIcon className="w-5 h-5"/>
                  <span>Live Watch</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={() => setIsLogWatchModalOpen(true)}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 bg-bg-secondary text-text-primary ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <LogWatchIcon className="w-5 h-5"/>
                  <span>Log Watch</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={onOpenJournal}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 bg-bg-secondary text-text-primary ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <BookOpenIcon className="w-5 h-5"/>
                  <span>Journal</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={onToggleFavorite}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 transition-colors ${isFavorited ? 'bg-yellow-500/20 text-yellow-400' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <HeartIcon filled={isFavorited} className="w-5 h-5"/>
                  <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>
               <button
                  disabled={isFuture}
                  onClick={onRate}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 transition-colors ${episodeRating > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-bg-secondary text-text-primary'} ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <StarIcon className="w-5 h-5"/>
                  <span>{episodeRating > 0 ? `Rated ${episodeRating}/5` : 'Rate'}</span>
              </button>
              <button
                  disabled={isFuture}
                  onClick={() => { onDiscuss(); onClose(); }}
                  className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2 px-3 text-sm font-semibold rounded-md border border-primary-accent/20 transition-colors bg-bg-secondary text-text-primary ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:brightness-125'}`}
              >
                  <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5"/>
                  <span>Comments</span>
              </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EpisodeDetailModal;
