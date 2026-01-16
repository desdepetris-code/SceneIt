import React, { useState, useEffect, useMemo } from 'react';
import { TrackedItem, WatchProgress, TmdbMediaDetails, TmdbSeasonDetails, Episode, TvdbShow, EpisodeTag, LiveWatchMediaInfo, EpisodeProgress } from '../types';
import { getMediaDetails, getSeasonDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { PlayIcon } from './Icons';
import { getTvdbShowExtended } from '../services/tvdbService';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL, TMDB_IMAGE_BASE_URL } from '../constants';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import { isNewRelease, formatTime } from '../utils/formatUtils';
import BrandedImage from './BrandedImage';
import { getShowStatus } from '../utils/statusUtils';

interface ContinueWatchingProgressCardProps {
    item: TrackedItem & { isPaused?: boolean; elapsedSeconds?: number; seasonNumber?: number; episodeNumber?: number; episodeTitle?: string; runtime?: number };
    watchProgress: WatchProgress;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => void;
}

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // for TVDB images
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};


const ContinueWatchingProgressCard: React.FC<ContinueWatchingProgressCardProps> = ({ item, watchProgress, onSelectShow, onToggleEpisode }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<TmdbSeasonDetails | null>(null);
    const [nextEpisodeInfo, setNextEpisodeInfo] = useState<Episode | null>(null);
    const [tvdbDetails, setTvdbDetails] = useState<TvdbShow | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isPausedSession = item.isPaused && item.elapsedSeconds !== undefined && item.runtime !== undefined;

    const { 
        overallProgressPercent,
        totalEpisodes,
        watchedEpisodes,
        seasonProgressPercent,
        episodesLeftInSeason,
        currentSeasonNumber,
        totalEpisodesInSeason,
        watchedEpisodesInSeason,
        episodesLeftInShow
    } = useMemo(() => {
        if (!details) return { 
            overallProgressPercent: 0, totalEpisodes: 0, watchedEpisodes: 0, 
            seasonProgressPercent: 0, episodesLeftInSeason: 0, currentSeasonNumber: 0,
            totalEpisodesInSeason: 0, watchedEpisodesInSeason: 0, episodesLeftInShow: 0,
        };
        
        const isPaused = item.isPaused && item.seasonNumber !== undefined;
        const progressForShow = watchProgress[item.id] || {};
        const seasonsForCalc = (details.seasons || []).filter(s => s.season_number > 0);
        const total = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);

        let watched = 0;
        for (const season of seasonsForCalc) {
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status === 2) {
                    watched++;
                }
            }
        }
        
        const overallPercent = total > 0 ? (watched / total) * 100 : 0;
        const leftInShow = total - watched;

        let currentSNum = 0;
        if (isPaused) {
            currentSNum = item.seasonNumber!;
        } else if (nextEpisodeInfo) {
            currentSNum = nextEpisodeInfo.season_number;
        }

        const currentSeason = seasonsForCalc.find(s => s.season_number === currentSNum);
        if (!currentSeason) {
             return { 
                overallProgressPercent: overallPercent, totalEpisodes: total, watchedEpisodes: watched, episodesLeftInShow: leftInShow,
                seasonProgressPercent: 0, episodesLeftInSeason: 0, currentSeasonNumber: 0,
                totalEpisodesInSeason: 0, watchedEpisodesInSeason: 0,
            };
        }

        const watchedInSeason = Object.values(progressForShow[currentSeason.season_number] || {}).filter(ep => (ep as EpisodeProgress).status === 2).length;
        const totalInSeason = currentSeason.episode_count;
        const sProgress = totalInSeason > 0 ? (watchedInSeason / totalInSeason) * 100 : 0;
        const sLeft = totalInSeason - watchedInSeason;

        return { 
            overallProgressPercent: overallPercent, 
            totalEpisodes: total, 
            watchedEpisodes: watched,
            episodesLeftInShow: leftInShow,
            seasonProgressPercent: sProgress,
            episodesLeftInSeason: sLeft,
            currentSeasonNumber: currentSNum,
            totalEpisodesInSeason: totalInSeason,
            watchedEpisodesInSeason: watchedInSeason
        };
    }, [details, watchProgress, item, nextEpisodeInfo]);


    useEffect(() => {
        let isMounted = true;
        const fetchAllDetails = async () => {
            if (!item.id) return;
            setIsLoading(true);
            try {
                const mediaDetails = await getMediaDetails(item.id, 'tv');
                if (!isMounted) return;
                setDetails(mediaDetails);
                
                if (mediaDetails.external_ids?.tvdb_id) {
                    getTvdbShowExtended(mediaDetails.external_ids.tvdb_id)
                        .then(tvdbData => {
                           if (isMounted) setTvdbDetails(tvdbData);
                        })
                        .catch(e => console.error("Failed to get TVDB details", e));
                }

                if (isPausedSession) {
                    setIsLoading(false);
                    return;
                }

                const progressForShow = watchProgress[item.id] || {};
                const sortedSeasons = [...(mediaDetails.seasons || [])]
                    .filter(s => s.season_number > 0)
                    .sort((a, b) => a.season_number - b.season_number);
                
                const today = new Date().toISOString().split('T')[0];
                let foundNextEpInfo: Episode | null = null;
                let foundSeasonDetails: TmdbSeasonDetails | null = null;

                for (const season of sortedSeasons) {
                    if (!isMounted) return;
                    const seasonData = await getSeasonDetails(item.id, season.season_number).catch(() => null);
                    if (!isMounted || !seasonData) continue;
                    
                    for (const ep of seasonData.episodes) {
                        const hasAired = ep.air_date && ep.air_date <= today;
                        const isWatched = progressForShow[ep.season_number]?.[ep.episode_number]?.status === 2;
                        if (hasAired && !isWatched) {
                            foundNextEpInfo = ep;
                            foundSeasonDetails = seasonData;
                            break;
                        }
                    }
                    if (foundNextEpInfo) break;
                }

                if (isMounted) {
                    setSeasonDetails(foundSeasonDetails);
                    setNextEpisodeInfo(foundNextEpInfo);
                }
            } catch (error) {
                console.error(`Failed to fetch details for ${item.title}`, error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchAllDetails();
        return () => {
            isMounted = false;
        };
    }, [item.id, item.title, watchProgress, isPausedSession]);

    const showStatusText = useMemo(() => {
        if (!details) return null;
        return getShowStatus(details)?.text ?? null;
    }, [details]);
    
    const mainPosterSrcs = useMemo(() => {
        const tvdbPoster = tvdbDetails?.artworks?.find(art => art.type === 2)?.image;
        const nextSeasonNumber = isPausedSession ? item.seasonNumber : nextEpisodeInfo?.season_number;
        const tmdbSeason = details?.seasons?.find(s => s.season_number === nextSeasonNumber);

        const paths = [
            tmdbSeason?.poster_path, // SEASON POSTER PRIORITY
            tvdbPoster,
            details?.poster_path,
            item.poster_path,
            nextEpisodeInfo?.still_path,
        ];

        return paths.map((p) => getFullImageUrl(p, 'w500'));
    }, [details, item.poster_path, nextEpisodeInfo, isPausedSession, item.seasonNumber, tvdbDetails]);
    
    const episodeStillSrcs = useMemo(() => {
        if (isPausedSession) {
             return [getImageUrl(item.poster_path, 'w300', 'poster')];
        }
        const paths = [
            nextEpisodeInfo?.still_path, // EPISODE STILL PRIORITY
            seasonDetails?.poster_path,
            details?.poster_path,
        ];
        return [
            getFullImageUrl(paths[0], 'w300'),
            getFullImageUrl(paths[1], 'w342'),
            getFullImageUrl(paths[2], 'w342'),
        ];
    }, [nextEpisodeInfo, seasonDetails, details, isPausedSession, item.poster_path]);

    const episodeTag: EpisodeTag | null = useMemo(() => {
        if (!nextEpisodeInfo || !details) return null;
        const season = details.seasons?.find(s => s.season_number === nextEpisodeInfo.season_number);
        return getEpisodeTag(nextEpisodeInfo, season, details, seasonDetails);
    }, [nextEpisodeInfo, details, seasonDetails]);

    const isNew = isNewRelease(nextEpisodeInfo?.air_date);

    if (isLoading) {
        return (
            <div className="w-full aspect-[10/16] bg-card-gradient rounded-lg shadow-md animate-pulse">
                <div className="w-full h-full bg-bg-secondary rounded-lg"></div>
            </div>
        );
    }
    
    if (!details || (!nextEpisodeInfo && !isPausedSession)) return null;

    const handleMarkWatched = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (nextEpisodeInfo) {
            const tmdbSeason = details?.seasons?.find(s => s.season_number === nextEpisodeInfo.season_number);
            onToggleEpisode(item.id, nextEpisodeInfo.season_number, nextEpisodeInfo.episode_number, 0, item, nextEpisodeInfo.name, nextEpisodeInfo.still_path, tmdbSeason?.poster_path);
        }
    };
    
    const episodeProgressPercent = isPausedSession ? (item.elapsedSeconds! / (item.runtime! * 60)) * 100 : 0;
    const remainingSeconds = isPausedSession ? (item.runtime! * 60) - item.elapsedSeconds! : 0;

    return (
        <div 
            className="w-full bg-card-gradient rounded-lg shadow-lg flex flex-col relative overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-2"
            onClick={() => onSelectShow(item.id, 'tv')}
        >
            <div className="aspect-[10/16] relative">
                <BrandedImage title={item.title} status={showStatusText}>
                    <FallbackImage 
                        srcs={mainPosterSrcs}
                        placeholder={PLACEHOLDER_POSTER}
                        noPlaceholder={true}
                        alt={`${item.title} preview`} 
                        className="absolute inset-0 w-full h-full object-cover" 
                    />
                </BrandedImage>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                
                <div className="absolute top-2 right-2 flex items-center space-x-2">
                    {isNew && <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-cyan-500/20 text-cyan-300">New</span>}
                    {episodeTag && (
                        <div className={`text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm ${episodeTag.className}`}>
                            {episodeTag.text}
                        </div>
                    )}
                </div>

                {nextEpisodeInfo && !isPausedSession && (
                <div className="absolute bottom-[28%] right-3 z-20">
                    <FallbackImage 
                        srcs={episodeStillSrcs} 
                        placeholder={PLACEHOLDER_STILL}
                        noPlaceholder={true}
                        alt="Next episode thumbnail" 
                        className="w-28 aspect-video object-cover rounded-md border-2 border-white/20 shadow-lg transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 pl-8 mt-auto">
                    <h3 className="font-bold text-white text-lg truncate [text-shadow:0_1px_3px_#000]">{item.title}</h3>
                    {isPausedSession ? (
                        <>
                            <p className="text-sm text-white/80 truncate [text-shadow:0_1px_3px_#000]">
                                {`S${item.seasonNumber} E${item.episodeNumber}: ${item.episodeTitle}`}
                            </p>
                            <p className="text-xs text-amber-300 font-semibold">{`${formatTime(remainingSeconds)} remaining`}</p>
                        </>
                    ) : nextEpisodeInfo ? (
                        <p className="text-sm text-white/80 truncate [text-shadow:0_1px_3px_#000]">
                            {`S${nextEpisodeInfo.season_number} E${nextEpisodeInfo.episode_number}: ${nextEpisodeInfo.name}`}
                        </p>
                    ) : (
                        <p className="text-sm text-green-400 font-semibold">All caught up!</p>
                    )}
                </div>

                {nextEpisodeInfo && !isPausedSession && (
                <div
                    onClick={handleMarkWatched}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Mark next episode watched"
                >
                    <div className="p-4 bg-backdrop rounded-full">
                        <PlayIcon className="w-8 h-8 text-white" />
                    </div>
                </div>
                )}
                
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20">
                    <div className="h-full bg-accent-gradient transition-all duration-500" style={{ width: `${isPausedSession ? episodeProgressPercent : overallProgressPercent}%` }}></div>
                </div>
            </div>
            <div className="p-3 bg-bg-secondary/30 text-xs">
                <div className="space-y-2">
                    {currentSeasonNumber > 0 && (
                        <div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-text-primary">Season {currentSeasonNumber}</span>
                                <span className="text-text-secondary">{episodesLeftInSeason} episodes left</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-1.5 mt-1">
                                <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${seasonProgressPercent}%` }}></div>
                            </div>
                            <div className="text-right text-text-secondary/80">{watchedEpisodesInSeason} / {totalEpisodesInSeason} ({seasonProgressPercent.toFixed(0)}%)</div>
                        </div>
                    )}
                    {totalEpisodes > 0 && (
                        <div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-text-primary">Overall Progress</span>
                                <span className="text-text-secondary">{episodesLeftInShow} episodes left</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-1.5 mt-1">
                                <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${overallProgressPercent}%` }}></div>
                            </div>
                            <div className="text-right text-text-secondary/80">{watchedEpisodes} / {totalEpisodes} ({overallProgressPercent.toFixed(0)}%)</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContinueWatchingProgressCard;