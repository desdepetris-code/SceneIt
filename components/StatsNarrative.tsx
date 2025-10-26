import React, { useState, useEffect } from 'react';
import { CalculatedStats } from '../types';

interface StatsNarrativeProps {
  stats: CalculatedStats;
  genres: Record<number, string>;
}

const StatsNarrative: React.FC<StatsNarrativeProps> = ({ stats, genres }) => {
  const [joinDate, setJoinDate] = useState<string | null>(null);

  useEffect(() => {
    const storedDate = localStorage.getItem('sceneit_join_date');
    if (storedDate) {
      setJoinDate(new Date(storedDate).toLocaleDateString());
    }
  }, []);

  const {
    totalHoursWatched,
    totalEpisodesWatched,
    moviesCompleted,
    mostActiveDay,
    topGenresAllTime,
    longestStreak,
    journalCount,
  } = stats;
  
  const topGenre = genres[topGenresAllTime[0]] || 'a variety of genres';

  if (totalEpisodesWatched === 0 && moviesCompleted === 0) {
      return null; // Don't show for new users with no data
  }

  return (
    <div className="bg-bg-secondary/50 p-4 rounded-lg mb-8 text-text-secondary text-sm space-y-2">
      <p>
        Welcome back! 
        {joinDate && ` You've been a SceneIt user since ${joinDate}. `}
        In that time, you've watched <strong className="text-text-primary">{totalEpisodesWatched} episodes</strong> and <strong className="text-text-primary">{moviesCompleted} movies</strong>, 
        totaling approximately <strong className="text-text-primary">{totalHoursWatched} hours</strong> of content.
      </p>
      <p>
        Your logs show you're most active on <strong className="text-text-primary">{mostActiveDay}s</strong>.
        You have a keen eye for <strong className="text-text-primary">{topGenre}</strong>, which seems to be your favorite genre.
        Plus, you've captured your thoughts in <strong className="text-text-primary">{journalCount} journal entries</strong> and achieved an impressive watch streak of <strong className="text-text-primary">{longestStreak} days</strong>. Keep it up!
      </p>
    </div>
  );
};

export default StatsNarrative;