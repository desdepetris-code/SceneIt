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
      if ((ach.id.startsWith('pilot_') || ach.id.startsWith('season_') || ach.id.startsWith('series_') || ach.id.startsWith('halfway_') || ach.id.startsWith('episode_')) && details.media_type !== 'tv') return;

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
  
  const hasAnyAchievements = categories.some(cat => 
    processedAchievements[cat].unlocked.length > 0 || processedAchievements[cat].locked.length > 0
  );

  if (!hasAnyAchievements) {
    return (
        <div className="text-center py-10">
            <p className="text-text-secondary">No specific achievements available for this title yet.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {categories.map(category => {
        const { unlocked, locked } = processedAchievements[category];
        if (unlocked.length === 0 && locked.length === 0) return null;

        return (
          <section key={category}>
            <h3 className="text-xl font-bold text-text-primary mb-4">{category} Achievements</h3>
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
