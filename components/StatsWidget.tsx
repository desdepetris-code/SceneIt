import React, { useState, useMemo } from 'react';
import { UserData } from '../types';
import { useAchievements } from '../hooks/useAchievements';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
import { ClockIcon, FireIcon, ViewGridIcon, ChevronDownIcon, BadgeIcon } from './Icons';

interface StatsWidgetProps {
  userData: UserData;
  genres: Record<number, string>;
}

const StatItem: React.FC<{ icon: React.ReactNode, label: string, value: string | React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-center space-x-3">
        <div className="text-primary-accent">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary">{label}</p>
            <div className="text-md font-bold text-text-primary">{value}</div>
        </div>
    </div>
);

const StatsWidget: React.FC<StatsWidgetProps> = ({ userData, genres }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Destructure `achievements` array from the hook's return object.
  const { achievements } = useAchievements(userData);
  const calculatedStats = useCalculatedStats(userData);

  const stats = useMemo(() => {
    const {
      hoursWatchedThisMonth,
      longestStreak,
      topGenresThisMonth,
    } = calculatedStats;
    
    const mostRecentUnlocked = [...achievements]
        .filter(a => a.unlocked)
        .sort((a, b) => {
            const difficultyOrder = { 'Hard': 0, 'Medium': 1, 'Easy': 2 };
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        })[0];


    return {
      hoursWatchedThisMonth: hoursWatchedThisMonth,
      longestStreak,
      topGenres: topGenresThisMonth.map((id: number) => genres[id]).filter(Boolean).join(', '),
      mostRecentUnlocked
    };
  }, [achievements, calculatedStats, genres]);

  return (
    <div className="px-6 my-8">
        <div className="bg-card-gradient rounded-lg shadow-md">
            <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <h2 className="text-xl font-bold text-text-primary">Your Stats</h2>
                <ChevronDownIcon className={`h-6 w-6 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            {isExpanded && (
                <div className="p-4 border-t border-bg-secondary animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        <StatItem icon={<ClockIcon className="w-6 h-6"/>} label="Hours Watched (Month)" value={`${stats.hoursWatchedThisMonth}h`} />
                        <StatItem icon={<FireIcon className="w-6 h-6"/>} label="Longest Streak" value={`${stats.longestStreak} days`} />
                        <StatItem icon={<ViewGridIcon className="w-6 h-6"/>} label="Top Genres (Month)" value={stats.topGenres || 'N/A'} />
                        <StatItem 
                            icon={<BadgeIcon className="w-6 h-6"/>} 
                            label="Last Badge" 
                            value={stats.mostRecentUnlocked?.name || 'None yet!'} 
                        />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default StatsWidget;
