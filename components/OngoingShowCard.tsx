import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMediaDetails, TrackedItem, Episode, WatchProgress, EpisodeProgress } from '../types';
import { getMediaDetails, getSeasonDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { PlayCircleIcon } from './Icons';
import BrandedImage from './BrandedImage';
import { getShowStatus } from '../utils/statusUtils';
import { getAiredEpisodeCount } from '../utils/formatUtils';

interface OngoingShowCardProps {
    item: TrackedItem;
    watchProgress: WatchProgress;
    onSelect: (id: number, media_type: 'tv') => void;
}

const OngoingShowCard: React.FC<OngoingShowCardProps> = ({ item, watchProgress, onSelect }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [firstUnwatched, setFirstUnwatched] = useState<Episode | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchOngoingDetails = async () => {
            setIsLoading(true);
            try {
                const showDetails = await getMediaDetails(item.id, 'tv');
                if (!isMounted) return;
                setDetails(showDetails);

                const progress = watchProgress[item.id] || {};
                const today = new Date().toISOString().split('T')[0];
                let found: Episode | null = null;

                const sortedSeasons = [...(showDetails.seasons || [])]
                    .filter(s => s.season_number > 0)
                    .sort((a, b) => a.season_number - b.season_number);

                for (const season of sortedSeasons) {
                    const sd = await getSeasonDetails(item.id, season.season_number).catch(() => null);
                    if (!sd || !isMounted) continue;

                    for (const ep of sd.episodes) {
                        const isWatched = progress[season.season_number]?.[ep.episode_number]?.status === 2;
                        const hasAired = ep.air_date && ep.air_date <= today;
                        if (hasAired && !isWatched) {
                            found = ep;
                            break;
                        }
                    }
                    if (found) break;
                }
                if (isMounted) setFirstUnwatched(found);
            } catch (e) {
                console.error("Failed to fetch ongoing card details", e);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchOngoingDetails();
        return () => { isMounted = false; };
    }, [item.id, watchProgress]);

    const stats = useMemo(() => {
        if (!details) return null;
        const progress = watchProgress[item.id] || {};
        const airedTotal = getAiredEpisodeCount(details);
        
        let watchedTotal = 0;
        let unwatchedSeasons = new Set<number>();

        Object.entries(progress).forEach(([sNum, season]) => {
            const sInt = Number(sNum);
            Object.values(season).forEach(ep => {
                if ((ep as EpisodeProgress).status === 2) watchedTotal++;
            });
        });

        (details.seasons || []).forEach(s => {
            if (s.season_number <= 0) return;
            let watchedInSeason = 0;
            const seasonProgress = progress[s.season_number] || {};
            Object.values(seasonProgress).forEach(ep => {
                if ((ep as EpisodeProgress).status === 2) watchedInSeason++;
            });
            if (watchedInSeason < s.episode_count) {
                unwatchedSeasons.add(s.season_number);
            }
        });

        return {
            unwatchedEpisodes: Math.max(0, airedTotal - watchedTotal),
            seasonsRemaining: unwatchedSeasons.size
        };
    }, [details, watchProgress, item.id]);

    if (isLoading) {
        return <div className="aspect-[2/3] w-full bg-bg-secondary/20 rounded-2xl animate-pulse border border-white/5"></div>;
    }

    if (!details) return null;

    const showStatus = getShowStatus(details);

    return (
        <div 
            onClick={() => onSelect(item.id, 'tv')}
            className="group relative flex flex-col bg-bg-secondary/20 rounded-3xl border border-white/5 overflow-hidden hover:border-primary-accent/30 transition-all shadow-xl cursor-pointer"
        >
            <div className="aspect-[10/14] relative overflow-hidden">
                <BrandedImage title={details.name || ''} status={showStatus?.text}>
                    <img 
                        src={getImageUrl(details.poster_path, 'w500')} 
                        alt={details.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                </BrandedImage>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-4 bg-backdrop/60 backdrop-blur-md rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                        <PlayCircleIcon className="w-10 h-10 text-white" />
                    </div>
                </div>
            </div>

            <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter truncate group-hover:text-primary-accent transition-colors">
                        {details.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 mb-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary-accent bg-primary-accent/10 px-2 py-0.5 rounded border border-primary-accent/20 shadow-sm">
                            {stats?.seasonsRemaining} Seasons Left
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary opacity-60">
                            {stats?.unwatchedEpisodes} Left to Aired
                        </span>
                    </div>
                </div>

                {firstUnwatched ? (
                    <div className="bg-bg-primary/40 rounded-2xl p-4 border border-white/5 shadow-inner">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-40 mb-2">First Unwatched</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-accent">
                            S{firstUnwatched.season_number} E{firstUnwatched.episode_number}
                        </p>
                        <h4 className="text-sm font-black text-text-primary truncate mt-0.5">{firstUnwatched.name}</h4>
                        <p className="text-[9px] font-bold text-text-secondary mt-1 opacity-50">
                            Aired: {firstUnwatched.air_date ? new Date(firstUnwatched.air_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 text-center">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Caught Up</p>
                        <p className="text-[9px] text-emerald-400/60 font-bold uppercase mt-1">Waiting for new content</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OngoingShowCard;