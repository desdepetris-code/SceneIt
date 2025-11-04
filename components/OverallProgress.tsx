import React, { useMemo } from 'react';
import { TmdbMediaDetails, WatchProgress, EpisodeProgress } from '../types';

interface OverallProgressProps {
  details: TmdbMediaDetails;
  watchProgress: WatchProgress;
}

const OverallProgress: React.FC<OverallProgressProps> = ({ details, watchProgress }) => {
  const { watchedCount, totalCount, progressPercent } = useMemo(() => {
    if (!details.seasons) return { watchedCount: 0, totalCount: 0, progressPercent: 0 };
    
    const seasonsForCalc = details.seasons.filter(s => s.season_number > 0 && s.episode_count > 0);
    const total = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);
    
    let watched = 0;
    const progressForShow = watchProgress[details.id] || {};
    
    for (const season of seasonsForCalc) {
        for (let i = 1; i <= season.episode_count; i++) {
            if (progressForShow[season.season_number]?.[i]?.status === 2) {
                watched++;
            }
        }
    }
    
    const percent = total > 0 ? (watched / total) * 100 : 0;
    return { watchedCount: watched, totalCount: total, progressPercent: percent };
  }, [details, watchProgress]);

  if (totalCount === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-text-primary mb-3">Overall Progress</h2>
      <div className="bg-card-gradient p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <div 
              className="flex-grow bg-bg-secondary rounded-full h-4"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              title={`${watchedCount} of ${totalCount} episodes watched`}
          >
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex-shrink-0 font-semibold text-sm whitespace-nowrap">
            <span className="text-text-primary">{progressPercent.toFixed(0)}%</span>
            <span className="text-text-secondary"> Complete</span>
          </div>
        </div>
        <div className="text-right text-xs text-text-secondary mt-1">
          {watchedCount} of {totalCount} episodes watched
        </div>
      </div>
    </section>
  );
};

export default OverallProgress;