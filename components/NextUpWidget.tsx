import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMediaDetails, Episode, LiveWatchMediaInfo, FavoriteEpisodes, WatchProgress, JournalEntry, Comment, TmdbSeasonDetails, TrackedItem } from '../types';
import { getSeasonDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { CheckCircleIcon, PlayCircleIcon, BookOpenIcon, StarIcon, ChatBubbleOvalLeftEllipsisIcon, ClockIcon } from './Icons';
import CommentModal from './CommentModal';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import { formatTimeFromDate } from '../utils/formatUtils';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';

interface NextUpWidgetProps {
    showId: number;
    details: TmdbMediaDetails;
    nextEpisodeToWatch: { seasonNumber: number; episodeNumber: number } | null;
    onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => void;
    onOpenJournal: (season: number, episode: Episode) => void;
    onOpenCommentModal: (episode: Episode) => void;
    favoriteEpisodes: FavoriteEpisodes;
    onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
    onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
    watchProgress: WatchProgress;
    onSaveJournal: (showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry | null) => void;
    onSaveComment: (commentData: any) => void;
    comments: Comment[];
    onSelectShow?: (id: number, media_type: 'tv' | 'movie' | 'person') => void;
    timezone: string;
}

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean; isActive?: boolean; }> = ({ icon, label, onClick, disabled, isActive }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center space-y-1 w-full h-full p-2 rounded-lg border transition-all ${disabled ? 'text-text-secondary/50 cursor-not-allowed bg-bg-secondary/30 border-primary-accent/10' : (isActive ? 'bg-primary-accent/20 border-primary-accent shadow-lg text-primary-accent' : 'bg-bg-secondary border-primary-accent/20 text-text-primary hover:border-primary-accent hover:bg-bg-secondary/70')}`}
    >
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-tight text-center">{label}</span>
    </button>
);

const NextUpWidget: React.FC<NextUpWidgetProps> = (props) => {
    const { showId, details, nextEpisodeToWatch, onToggleEpisode, onOpenJournal, onOpenCommentModal, favoriteEpisodes, onToggleFavoriteEpisode, onStartLiveWatch, watchProgress, onSaveJournal, onSaveComment, comments, onSelectShow, timezone } = props;
    
    const [episodeDetails, setEpisodeDetails] = useState<Episode | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<TmdbSeasonDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchNextEpisode = async () => {
            if (!nextEpisodeToWatch) {
                setEpisodeDetails(null);
                return;
            }
            setIsLoading(true);
            try {
                const seasonData = await getSeasonDetails(showId, nextEpisodeToWatch.seasonNumber);
                if (isMounted) {
                    setSeasonDetails(seasonData);
                    const nextEp = seasonData.episodes.find(e => e.episode_number === nextEpisodeToWatch.episodeNumber);
                    setEpisodeDetails(nextEp || null);
                }
            } catch (error) {
                console.error("Failed to fetch next episode details", error);
                if (isMounted) setEpisodeDetails(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchNextEpisode();
        return () => { isMounted = false; };
    }, [showId, nextEpisodeToWatch]);

    const tag = useMemo(() => {
        if (!episodeDetails || !details || !seasonDetails) return null;
        const season = details.seasons?.find(s => s.season_number === episodeDetails.season_number);
        return getEpisodeTag(episodeDetails, season, details, seasonDetails);
    }, [episodeDetails, details, seasonDetails]);

    const imageSrcs = useMemo(() => {
        if (!episodeDetails) return { still: [], backdrop: [getImageUrl(details.backdrop_path, 'w500', 'backdrop')] };

        const season = details.seasons?.find(s => s.season_number === episodeDetails.season_number);
        const stillSrcs = [
            getImageUrl(episodeDetails.still_path, 'w500', 'still'),
            getImageUrl(season?.poster_path, 'w500', 'poster'),
            getImageUrl(details.poster_path, 'w500', 'poster'),
        ];
        return {
            still: stillSrcs,
            backdrop: [getImageUrl(details.backdrop_path, 'w500', 'backdrop')]
        };
    }, [episodeDetails, details]);
    
    const airtimeTruth = useMemo(() => {
        if (!episodeDetails) return null;
        const override = AIRTIME_OVERRIDES[showId];
        if (!override) return null;
        const key = `S${episodeDetails.season_number}E${episodeDetails.episode_number}`;
        const timeInfo = override.episodes?.[key];
        if (!timeInfo) return null;
        return `${timeInfo} on ${override.provider}`;
    }, [showId, episodeDetails]);

    if (isLoading) {
        return (
            <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-40 bg-bg-secondary"></div>
                <div className="p-4 space-y-3">
                    <div className="h-4 bg-bg-secondary rounded w-3/4"></div>
                    <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
                    <div className="h-10 bg-bg-secondary rounded w-full"></div>
                </div>
            </div>
        );
    }
    
    if (!episodeDetails) return null;

    const epProgress = watchProgress[showId]?.[episodeDetails.season_number]?.[episodeDetails.episode_number];
    const isWatched = epProgress?.status === 2;
    const isFavorited = favoriteEpisodes[showId]?.[episodeDetails.season_number]?.[episodeDetails.episode_number] || false;
    const hasJournal = !!(epProgress?.journal?.text || epProgress?.journal?.mood);

    const episodeMediaKey = `tv-${showId}-s${episodeDetails.season_number}-e${episodeDetails.episode_number}`;
    const existingComment = comments.find(c => c.mediaKey === episodeMediaKey);

    const handleMarkWatched = () => {
        const season = details.seasons?.find(s => s.season_number === episodeDetails.season_number);
        onToggleEpisode(showId, episodeDetails.season_number, episodeDetails.episode_number, isWatched ? 2 : 0, details as TrackedItem, episodeDetails.name, episodeDetails.still_path, season?.poster_path);
    };
    
    const handleOpenJournal = () => onOpenJournal(episodeDetails.season_number, episodeDetails);
    const handleOpenComment = () => onOpenCommentModal(episodeDetails);
    const handleToggleFavorite = () => onToggleFavoriteEpisode(showId, episodeDetails.season_number, episodeDetails.episode_number);
    
    const handleLiveWatch = () => {
        const mediaInfo: LiveWatchMediaInfo = {
            id: showId, media_type: 'tv', title: details.name || 'Show',
            poster_path: details.poster_path, runtime: details.episode_run_time?.[0] || 45,
            seasonNumber: episodeDetails.season_number, episodeNumber: episodeDetails.episode_number,
            episodeTitle: episodeDetails.name,
        };
        onStartLiveWatch(mediaInfo);
    };
    
    return (
        <div className="bg-card-gradient rounded-2xl shadow-xl overflow-hidden border border-white/5 group/widget">
            <div 
                className="h-44 w-full bg-cover bg-center flex items-center justify-center relative cursor-pointer overflow-hidden"
                style={{ backgroundImage: `url(${imageSrcs.backdrop[0]})` }}
                onClick={() => onSelectShow?.(showId, 'tv')}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-all group-hover/widget:backdrop-blur-0 group-hover/widget:bg-black/20"></div>
                    <FallbackImage
                    srcs={imageSrcs.still}
                    placeholder={PLACEHOLDER_STILL}
                    alt={`Still from ${episodeDetails.name}`}
                    className="relative h-full w-auto object-contain transition-transform duration-700 group-hover/widget:scale-110"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {tag && (
                        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-lg self-start ${tag.className}`}>
                            {tag.text}
                        </div>
                    )}
                    {airtimeTruth && (
                        <div className="bg-primary-accent/80 backdrop-blur-md text-on-accent text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-lg self-start flex items-center gap-1.5">
                            <ClockIcon className="w-3 h-3" />
                            {airtimeTruth}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="p-6">
                <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-accent mb-1">
                        S{episodeDetails.season_number} E{episodeDetails.episode_number}
                    </p>
                    <h4 className="font-black text-xl text-text-primary uppercase tracking-tighter truncate leading-none">{episodeDetails.name}</h4>
                </div>
                
                <p className="text-xs text-text-secondary/70 line-clamp-2 leading-relaxed mb-6 font-medium">{episodeDetails.overview || "No preview available for this episode."}</p>
                
                <div className="grid grid-cols-5 gap-3">
                    <ActionButton 
                        icon={<CheckCircleIcon className={`w-5 h-5 ${isWatched ? 'text-green-400' : ''}`} />} 
                        label={isWatched ? "Done" : "Watch"} 
                        onClick={handleMarkWatched} 
                        isActive={isWatched}
                    />
                    <ActionButton 
                        icon={<PlayCircleIcon className="w-5 h-5" />} 
                        label="Live" 
                        onClick={handleLiveWatch} 
                    />
                    <ActionButton 
                        icon={<BookOpenIcon className={`w-5 h-5 ${hasJournal ? 'text-primary-accent' : ''}`} />} 
                        label="Journal" 
                        onClick={handleOpenJournal} 
                        isActive={hasJournal}
                    />
                    <ActionButton 
                        icon={<ChatBubbleOvalLeftEllipsisIcon className={`w-5 h-5 ${existingComment ? 'text-sky-400' : ''}`} />} 
                        label="Comments" 
                        onClick={handleOpenComment}
                        isActive={!!existingComment}
                    />
                    <ActionButton 
                        icon={<StarIcon filled={isFavorited} className={`w-5 h-5 ${isFavorited ? 'text-yellow-400' : ''}`} />} 
                        label="Fav" 
                        onClick={handleToggleFavorite} 
                        isActive={isFavorited}
                    />
                </div>
            </div>
        </div>
    );
};

export default NextUpWidget;