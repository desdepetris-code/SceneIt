
import React, { useMemo } from 'react';
import { UserData, UserAchievementStatus } from '../../types';
import { useAchievements } from '../../hooks/useAchievements';
import { BadgeIcon } from '../Icons';

interface AchievementsWidgetProps {
    userData: UserData;
    onNavigate: () => void;
}

const AchievementItem: React.FC<{ ach: UserAchievementStatus }> = ({ ach }) => {
    const progressPercent = ach.goal > 0 ? Math.min((ach.progress / ach.goal) * 100, 100) : 0;

    return (
        <div className="flex items-center space-x-3">
            <BadgeIcon className={`w-6 h-6 flex-shrink-0 ${ach.unlocked ? 'text-primary-accent' : 'text-text-secondary/50'}`} />
            <div className="flex-grow min-w-0">
                <p className="text-sm font-semibold truncate">{ach.name}</p>
                <div className="w-full bg-bg-primary rounded-full h-1.5 mt-1">
                    <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>
            <span className="text-xs font-bold text-text-secondary">{Math.floor(progressPercent)}%</span>
        </div>
    );
};


const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({ userData, onNavigate }) => {
    const { achievements, isLoading } = useAchievements(userData);

    const displayAchievements = useMemo(() => {
        if (isLoading) return { latest: null, upcoming: [] };

        const latest = achievements.find(a => a.unlocked);
        const upcoming = achievements.filter(a => !a.unlocked).slice(0, 2);
        
        return { latest, upcoming };
    }, [achievements, isLoading]);

    return (
        <div className="bg-card-gradient rounded-lg shadow-md p-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Achievements</h3>
            {isLoading ? <p className="text-sm text-text-secondary">Loading achievements...</p> : (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-text-secondary uppercase mb-2">Latest Unlocked</h4>
                        {displayAchievements.latest ? (
                            <AchievementItem ach={displayAchievements.latest} />
                        ) : (
                            <p className="text-sm text-text-secondary">No achievements unlocked yet.</p>
                        )}
                    </div>
                     <div>
                        <h4 className="text-xs font-bold text-text-secondary uppercase mb-2">Up Next</h4>
                         {displayAchievements.upcoming.length > 0 ? (
                            displayAchievements.upcoming.map(ach => <AchievementItem key={ach.id} ach={ach} />)
                         ) : (
                            <p className="text-sm text-text-secondary">All achievements unlocked!</p>
                         )}
                    </div>
                </div>
            )}
             <button onClick={onNavigate} className="w-full mt-4 text-center text-sm font-semibold text-primary-accent hover:underline">
                View All Achievements
            </button>
        </div>
    );
};

export default AchievementsWidget;
