import React, { useMemo, useState } from 'react';
import { TmdbMediaDetails, WatchProgress, EpisodeProgress } from '../types';
import { getAiredEpisodeCount } from '../utils/formatUtils';
import { InformationCircleIcon, XMarkIcon } from './Icons';

interface OverallProgressProps {
  details: TmdbMediaDetails;
  watchProgress: WatchProgress;
}

const OverallProgress: React.FC<OverallProgressProps> = ({ details, watchProgress }) => {
  const [showAiredNote, setShowAiredNote] = useState(false);

  const { watchedCount, totalAiredCount, specialsWatched, specialsTotal } = useMemo(() => {
    if (!details.seasons) {
        return { watchedCount: 0, totalAiredCount: 0, specialsWatched: 0, specialsTotal: 0 };
    }

    const airedCount = getAiredEpisodeCount(details);
    const progressForShow = watchProgress[details.id] || {};
    
    let regularWatched = 0;
    let s0Watched = 0;
    let s0Total = 0;

    // Calculate Specials (Season 0) separately
    const specialsSeason = details.seasons.find(s => s.season_number === 0);
    if (specialsSeason) {
        s0Total = specialsSeason.episode_count;
        const s0Progress = progressForShow[0] || {};
        Object.values(s0Progress).forEach(ep => {
            if ((ep as EpisodeProgress).status === 2) s0Watched++;
        });
    }

    // Calculate Regular Seasons
    Object.entries(progressForShow).forEach(([sNum, season]) => {
        if (Number(sNum) === 0) return; // Skip specials for the main bar
        Object.values(season).forEach(ep => {
            if ((ep as EpisodeProgress).status === 2) regularWatched++;
        });
    });

    return { 
        watchedCount: regularWatched, 
        totalAiredCount: airedCount,
        specialsWatched: s0Watched,
        specialsTotal: s0Total
    };
  }, [details, watchProgress]);
  
  const overallPercent = totalAiredCount > 0 ? (watchedCount / totalAiredCount) * 100 : 0;
  const specialsPercent = specialsTotal > 0 ? (specialsWatched / specialsTotal) * 100 : 0;

  // Don't render anything if there's no progress or data
  if (totalAiredCount === 0 && watchedCount === 0 && specialsTotal === 0) return null;

  return (
    <section className="mb-8 space-y-6">
      {/* Main Aired Content Progress Bar */}
      {(totalAiredCount > 0 || watchedCount > 0) && (
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-3">Overall Progress</h2>
          <div className="bg-card-gradient p-5 rounded-2xl shadow-xl relative border border-white/5">
            <div className="flex justify-between items-center text-sm mb-2">
                <div className="flex items-center gap-1.5 relative">
                    <span className="font-black text-[10px] uppercase tracking-widest text-primary-accent">Regular Seasons</span>
                    <button 
                        onClick={() => setShowAiredNote(!showAiredNote)}
                        className="text-text-secondary hover:text-primary-accent transition-colors"
                        aria-label="Aired episodes information"
                    >
                        <InformationCircleIcon className="w-4 h-4 opacity-50 hover:opacity-100" />
                    </button>
                    
                    {showAiredNote && (
                        <div className="absolute left-0 top-6 w-64 p-3 bg-bg-primary border border-white/10 rounded-xl shadow-2xl z-30 animate-fade-in">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">Aired Status</span>
                                <button onClick={() => setShowAiredNote(false)} className="text-text-secondary hover:text-white">
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                            <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                                This bar calculates progress based strictly on <span className="text-text-primary font-bold">episodes that have already aired</span>. Specials and future releases are excluded here.
                            </p>
                        </div>
                    )}
                </div>
                <span className="text-text-secondary font-black text-[10px] uppercase tracking-widest opacity-60">
                    {`${watchedCount} / ${totalAiredCount} eps`}
                </span>
            </div>
            <div className="w-full bg-bg-primary/50 rounded-full h-4 relative overflow-hidden shadow-inner border border-white/5">
                <div 
                    className="bg-accent-gradient h-4 rounded-full flex items-center justify-center text-[10px] font-black text-on-accent transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, overallPercent)}%` }}
                >
                    {overallPercent >= 12 && `${Math.round(overallPercent)}%`}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Specials Progress Bar */}
      {specialsTotal > 0 && (
        <div className="animate-fade-in">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-text-secondary mb-3 px-1 opacity-50">Specials & Extras</h3>
          <div className="bg-bg-secondary/10 p-5 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2">
                <span className="text-text-primary/70">Completion Log</span>
                <span className="text-primary-accent">{specialsWatched} / {specialsTotal} <span className="text-text-secondary opacity-40 ml-1">Captured</span></span>
            </div>
            <div className="w-full bg-bg-primary rounded-full h-1.5 overflow-hidden">
                <div 
                    className="bg-primary-accent h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--color-accent-primary-rgb),0.5)]"
                    style={{ width: `${Math.min(100, specialsPercent)}%` }}
                ></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OverallProgress;