import React, { useMemo } from 'react';
import { UserData, UserAchievementStatus, AchievementDifficulty } from '../types';
import { useAchievements } from '../hooks/useAchievements';
import AchievementBadge from '../components/AchievementBadge';

const AchievementsScreen: React.FC<{ userData: UserData }> = ({ userData }) => {
  const { achievements: allUserAchievements, isLoading } = useAchievements(userData);

  const { unlockedCount, totalCount, groupedAchievements } = useMemo(() => {
    if (isLoading) {
      return { unlockedCount: 0, totalCount: 0, groupedAchievements: { Easy: [], Medium: [], Hard: [] } };
    }
    const unlocked = allUserAchievements.filter(a => a.unlocked).length;
    const total = allUserAchievements.length;

    const groups: Record<AchievementDifficulty, UserAchievementStatus[]> = {
      Easy: [],
      Medium: [],
      Hard: [],
    };

    allUserAchievements.forEach(ach => {
      if (groups[ach.difficulty]) {
        groups[ach.difficulty].push(ach);
      }
    });

    return { unlockedCount: unlocked, totalCount: total || 1, groupedAchievements: groups };
  }, [allUserAchievements, isLoading]);
  
  const difficultyStyles: Record<AchievementDifficulty, { color: string; border: string }> = {
    Easy: { color: 'text-green-400', border: 'border-green-500/50' },
    Medium: { color: 'text-yellow-400', border: 'border-yellow-500/50' },
    Hard: { color: 'text-red-400', border: 'border-red-500/50' },
  };

  if (isLoading) {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary">Achievements</h1>
                <p className="text-text-secondary mt-1">Unlock badges and rewards by completing challenges.</p>
            </header>
            <div className="animate-pulse">
                <div className="h-32 bg-bg-secondary rounded-lg mb-8"></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Achievements</h1>
        <p className="text-text-secondary mt-1">Unlock badges by completing challenges.</p>
      </header>

      <div className="bg-card-gradient rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-bold text-text-primary">Overall Progress</h2>
                  <p className="text-text-secondary">{unlockedCount} of {totalCount} achievements unlocked</p>
              </div>
              <div className="text-4xl font-bold text-primary-accent">{Math.round((unlockedCount / totalCount) * 100)}%</div>
          </div>
          <div className="w-full bg-bg-secondary rounded-full h-2.5 mt-4">
              <div className="bg-accent-gradient h-2.5 rounded-full" style={{ width: `${(unlockedCount / totalCount) * 100}%` }}></div>
          </div>
      </div>

      {(['Easy', 'Medium', 'Hard'] as AchievementDifficulty[]).map((difficulty) => {
        const achievements = groupedAchievements[difficulty];
        if (!achievements || achievements.length === 0) return null;
        const styles = difficultyStyles[difficulty];
        return (
          <section key={difficulty} className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 flex items-center ${styles.color} border-b-2 pb-2 ${styles.border}`}>
              {difficulty} Tier
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map(ach => (
                <AchievementBadge key={ach.id} achievement={ach} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default AchievementsScreen;
