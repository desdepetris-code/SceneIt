
// components/ShowAchievementsTab.tsx
import React, { useMemo } from 'react';
import { TmdbMediaDetails, UserData } from '../types';
import { showAchievements, ShowAchievement } from '../data/showAchievements';
import ShowAchievementBadge from './ShowAchievementBadge';

interface ShowAchievementsTabProps {
  details: TmdbMediaDetails;
  userData: UserData;
}

type CategorizedAchievements = Record<ShowAchievement['category'], {
  unlocked: (ShowAchievement & { unlockDate: string | null })[];
  locked: ShowAchievement[];
}>;

const ShowAchievementsTab: React.FC<ShowAchievementsTabProps> = ({ details, userData }) => {
  const processedAchievements = useMemo(() => {
    const categorized: CategorizedAchievements = {
      Progress: { unlocked: [], locked: [] },
      Engagement: { unlocked: [], locked: [] },
      Community: { unlocked: [], locked: [] },
    };

    showAchievements.forEach(ach => {
      // Filter out achievements that don't apply to the media type
      if (ach.id.startsWith('movie_') && details.media_type !== 'movie') return;
      if (
        (ach.id.startsWith('pilot_') || 
         ach.id.startsWith('season_') || 
         ach.id.startsWith('series_') || 
         ach.id.startsWith('halfway_') || 
         ach.id.startsWith('episode_')) && 
        details.media_type !== 'tv'
      ) return;

      const { unlocked, unlockDate } = ach.check(details, userData);
      if (unlocked) {
        categorized[ach.category].unlocked.push({ ...ach, unlockDate });
      } else {
        categorized[ach.category].locked.push(ach);
      }
    });

    return categorized;
  }, [details, userData]);

  const categories: ShowAchievement['category'][] = ['Progress', 'Engagement', 'Community'];
  
  const hasAnyAchievements = useMemo(() => 
    categories.some(cat => 
        processedAchievements[cat].unlocked.length > 0 || 
        processedAchievements[cat].locked.length > 0
    )
  , [processedAchievements]);

  if (!hasAnyAchievements) {
    return (
        <div className="text-center py-10 bg-bg-secondary/30 rounded-xl">
            <p className="text-text-secondary italic">No specific badges available for this title yet.</p>
        </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {categories.map(category => {
        const { unlocked, locked } = processedAchievements[category];
        if (unlocked.length === 0 && locked.length === 0) return null;

        return (
          <section key={category}>
            <div className="flex items-center space-x-4 mb-6">
                <h3 className="text-xl font-black text-text-primary uppercase tracking-[0.2em]">{category}</h3>
                <div className="h-px flex-grow bg-white/5"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlocked.map(ach => (
                <ShowAchievementBadge
                  key={ach.id}
                  name={ach.name}
                  description={ach.description}
                  unlocked={true}
                  unlockDate={ach.unlockDate}
                />
              ))}
              {locked.map(ach => (
                <ShowAchievementBadge
                  key={ach.id}
                  name={ach.name}
                  description={ach.description}
                  unlocked={false}
                  unlockDate={null}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ShowAchievementsTab;
