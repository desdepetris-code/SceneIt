import React, { useMemo } from 'react';
import { TmdbMediaDetails, WatchProgress } from '../types';

interface OverallProgressProps {
  details: TmdbMediaDetails;
  watchProgress: WatchProgress;
}

const OverallProgress: React.FC<OverallProgressProps> = ({ details, watchProgress }) => {
  const { watchedCount, totalCount } = useMemo(() => {
    if (!details.seasons) {
        return { watchedCount: 0, totalCount: 0 };
    }

    const seasonsForCalc = [...details.seasons]
      .filter(s => s.season_number > 0 && s.episode_count > 0)
      .sort((a, b) => a.season_number - a.season_number);

    const progressForShow = watchProgress[details.id] || {};
    let totalWatched = 0;
    let totalEpisodes = 0;

    seasonsForCalc.forEach(season => {
        let seasonWatched = 0;
        for (let i = 1; i <= season.episode_count; i++) {
            if (progressForShow[season.season_number]?.[i]?.status === 2) {
                seasonWatched++;
            }
        }
        totalWatched += seasonWatched;
        totalEpisodes += season.episode_count;
    });

    return { 
        watchedCount: totalWatched, 
        totalCount: totalEpisodes,
    };
  }, [details, watchProgress]);
  
  const overallPercent = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0;

  if (totalCount === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-text-primary mb-3">Overall Progress</h2>
      <div className="bg-card-gradient p-4 rounded-lg shadow-md">
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="font-bold text-text-primary">Total Progress</span>
                <span className="text-text-secondary">{`${watchedCount} / ${totalCount} episodes`}</span>
            </div>
            <div className="w-full bg-bg-secondary rounded-full h-4 relative">
                <div 
                    className="bg-accent-gradient h-4 rounded-full flex items-center justify-center text-xs font-bold text-on-accent"
                    style={{ width: `${overallPercent}%` }}
                >
                    {overallPercent > 10 && `${overallPercent.toFixed(0)}%`}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default OverallProgress;