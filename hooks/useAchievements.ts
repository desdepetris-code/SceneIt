import { useMemo, useState, useEffect } from 'react';
import { UserData, UserAchievementStatus } from '../types';
import { allAchievements } from '../achievements';
import { useCalculatedStats } from './useCalculatedStats';
import { getCompletedSeasonsCount } from '../utils/seasonUtils';

export function useAchievements(data: UserData): { achievements: UserAchievementStatus[], isLoading: boolean } {
  const [statuses, setStatuses] = useState<UserAchievementStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const calculatedStats = useCalculatedStats(data);
  
  useEffect(() => {
    const checkAllAchievements = async () => {
        setIsLoading(true);
        const completedSeasons = await getCompletedSeasonsCount(data);
        const extendedStats = { ...calculatedStats, completedSeasonsCount: completedSeasons };

        const newStatuses = allAchievements.map(ach => {
            const { progress, goal } = ach.check(data, extendedStats);
            const unlocked = progress >= goal;
            return { ...ach, unlocked, progress, goal };
        });
        
        setStatuses(newStatuses);
        setIsLoading(false);
    };

    checkAllAchievements();
  }, [data, calculatedStats]);

  const sortedStatuses = useMemo(() => {
    return [...statuses].sort((a, b) => {
      if (a.unlocked !== b.unlocked) {
        return a.unlocked ? -1 : 1;
      }
      const progressA = a.goal > 0 ? a.progress / a.goal : 0;
      const progressB = b.goal > 0 ? b.progress / b.goal : 0;
      return progressB - progressA;
    });
  }, [statuses]);

  return { achievements: sortedStatuses, isLoading };
}
