
import React, { useMemo } from 'react';
import { CalculatedStats } from '../../types';
import { TvIcon, FilmIcon, ClockIcon, FireIcon } from '../Icons';

interface StatHighlightProps {
  stats: CalculatedStats;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-bg-secondary p-4 rounded-lg flex items-center space-x-4">
        <div className="text-primary-accent">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    </div>
);

const StatHighlight: React.FC<StatHighlightProps> = ({ stats }) => {

    const topStats = useMemo(() => {
        const {
            showsCompleted,
            moviesCompleted,
            longestStreak,
            totalHoursWatched,
        } = stats;
        
        return { 
            showsCompleted, 
            moviesCompleted, 
            longestStreak, 
            totalHoursWatched,
        };
    }, [stats]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Hours" value={`~${topStats.totalHoursWatched}h`} icon={<ClockIcon className="w-8 h-8"/>} />
            <StatCard title="Shows Completed" value={topStats.showsCompleted} icon={<TvIcon className="w-8 h-8" />} />
            <StatCard title="Movies Completed" value={topStats.moviesCompleted} icon={<FilmIcon className="w-8 h-8"/>} />
            <StatCard title="Longest Streak" value={`${topStats.longestStreak} days`} icon={<FireIcon className="w-8 h-8"/>} />
        </div>
    );
};

export default StatHighlight;
