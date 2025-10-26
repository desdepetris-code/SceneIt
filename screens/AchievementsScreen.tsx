import React, { useMemo } from 'react';
import { UserData } from '../types';
import { useAchievements } from '../hooks/useAchievements';
import AchievementBadge from '../components/AchievementBadge';

const SectionHeader: React.FC<{ title: string; count: number }> = ({ title, count }) => (
    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient mb-4">
        {title} <span className="text-lg font-normal text-text-secondary">({count})</span>
    </h2>
);

interface AchievementsScreenProps {
  userData: UserData;
}

const AchievementsSkeleton: React.FC = () => (
    <div className="animate-pulse">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-8">
                <div className="h-8 w-1/3 bg-bg-secondary rounded-md mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                </div>
            </div>
        ))}
    </div>
);


const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ userData }) => {
  const { achievements: allUserAchievements, isLoading } = useAchievements(userData);

  const achievementsByDifficulty = useMemo(() => {
    return {
      Easy: allUserAchievements.filter(a => a.difficulty === 'Easy'),
      Medium: allUserAchievements.filter(a => a.difficulty === 'Medium'),
      Hard: allUserAchievements.filter(a => a.difficulty === 'Hard'),
    };
  }, [allUserAchievements]);

  if (isLoading) {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary">Achievements</h1>
                <p className="text-text-secondary mt-1">Unlock badges and rewards by completing challenges.</p>
            </header>
            <AchievementsSkeleton />
        </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Achievements</h1>
        <p className="text-text-secondary mt-1">Unlock badges and rewards by completing challenges.</p>
      </header>

      <section className="mb-8">
        <SectionHeader title="Hard" count={achievementsByDifficulty.Hard.length} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievementsByDifficulty.Hard.map(ach => (
            <AchievementBadge 
              key={ach.id} 
              achievement={ach} 
              isPending={ach.unlocked && ach.adminApprovalRequired} 
            />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader title="Medium" count={achievementsByDifficulty.Medium.length} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievementsByDifficulty.Medium.map(ach => (
            <AchievementBadge 
              key={ach.id} 
              achievement={ach}
              isPending={ach.unlocked && ach.adminApprovalRequired} 
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Easy" count={achievementsByDifficulty.Easy.length} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievementsByDifficulty.Easy.map(ach => (
            <AchievementBadge 
              key={ach.id} 
              achievement={ach} 
              isPending={ach.unlocked && ach.adminApprovalRequired} 
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default AchievementsScreen;
