
import { useMemo } from 'react';
import { UserData, CalculatedStats, TrackedItem, EpisodeProgress } from '../types';

export function useCalculatedStats(data: UserData): CalculatedStats {
  return useMemo(() => {
    // Filter out history items with invalid timestamps to prevent crashes.
    const validHistory = data.history.filter(h => h.timestamp && !isNaN(new Date(h.timestamp).getTime()));

    // Total episodes watched
    const totalEpisodesWatched = validHistory.filter(h => h.media_type === 'tv').length;
    const nonManualEpisodesWatched = validHistory.filter(h => h.media_type === 'tv').length;
    
    // --- Time-based Stats ---
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const watchedThisWeek = validHistory.filter(h => 
        h.media_type === 'tv' && 
        new Date(h.timestamp) >= oneWeekAgo
    ).length;
    
    const episodesWatchedToday = validHistory.filter(h =>
        h.media_type === 'tv' &&
        new Date(h.timestamp) >= today
    ).length;
    
    const moviesWatchedToday = validHistory.filter(h =>
        h.media_type === 'movie' &&
        new Date(h.timestamp) >= today
    ).length;

    const moviesWatchedThisWeek = validHistory.filter(h =>
        h.media_type === 'movie' &&
        new Date(h.timestamp) >= oneWeekAgo
    ).length;
    
    const hoursWatchedThisWeek = (watchedThisWeek * 45 + moviesWatchedThisWeek * 100) / 60;

    // --- Journal counts ---
    const allProgressEntries = Object.values(data.watchProgress)
        .flatMap(show => Object.values(show))
        .flatMap(season => Object.values(season)) as EpisodeProgress[];

    const journalCount = allProgressEntries.filter(ep => ep.journal?.text).length;
    const moodJournalCount = allProgressEntries.filter(ep => ep.journal?.mood).length;

    const moodDistribution: Record<string, number> = {};
    allProgressEntries.forEach(ep => {
      if (ep.journal?.mood) {
        moodDistribution[ep.journal.mood] = (moodDistribution[ep.journal.mood] || 0) + 1;
      }
    });
    
    // --- List-based Stats ---
    const showsCompleted = data.completed.filter(i => i.media_type === 'tv').length;
    const moviesCompleted = data.completed.filter(i => i.media_type === 'movie').length;
    const totalItemsOnLists = data.watching.length + data.planToWatch.length + data.completed.length;
    const planToWatchCount = data.planToWatch.length;
    const showsWatchingCount = data.watching.filter(i => i.media_type === 'tv').length;
    const moviesToWatchCount = data.planToWatch.filter(i => i.media_type === 'movie').length;

    // --- Longest streak ---
    const uniqueDates = [...new Set(validHistory.map(h => new Date(h.timestamp).toDateString()))];
    uniqueDates.sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    
    let longestStreak = 0;
    if (uniqueDates.length > 0) {
        longestStreak = 1;
        let currentStreak = 1;
        for(let i = 1; i < uniqueDates.length; i++) {
            const date1 = new Date(uniqueDates[i-1]);
            const date2 = new Date(uniqueDates[i]);
            const diffTime = date2.getTime() - date1.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if(diffDays === 1) {
                currentStreak++;
            } else if (diffDays > 1) { // If there's a gap, reset.
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
            // If diffDays is 0, it's the same day, so do nothing to the streak.
        }
        longestStreak = Math.max(longestStreak, currentStreak);
    }
    
    // --- Genre count & monthly/yearly stats (from history) ---
    const allTrackedItemsById = new Map<number, TrackedItem>();
    [...data.watching, ...data.planToWatch, ...data.completed, ...data.favorites].forEach(item => {
        allTrackedItemsById.set(item.id, item);
    });

    const genresFromHistory = new Set<number>();
    validHistory.forEach(historyItem => {
        const trackedItem = allTrackedItemsById.get(historyItem.id);
        if (trackedItem && trackedItem.genre_ids) {
            trackedItem.genre_ids.forEach(genreId => genresFromHistory.add(genreId));
        }
    });
    const watchedGenreCount = genresFromHistory.size;
    
    let hoursWatchedThisMonth = 0;
    const genreCountsThisMonth: Record<number, number> = {};

    const historyThisMonth = validHistory.filter(h => new Date(h.timestamp) >= oneMonthAgo);
    const episodesWatchedThisMonth = historyThisMonth.filter(h => h.media_type === 'tv').length;
    const moviesWatchedThisMonth = historyThisMonth.filter(h => h.media_type === 'movie').length;

    historyThisMonth.forEach(h => {
        if (h.media_type === 'tv') {
            hoursWatchedThisMonth += 45; // Approx. 45 min per episode
        } else {
            hoursWatchedThisMonth += 100; // Approx. 100 min per movie
        }
        const trackedItem = allTrackedItemsById.get(h.id);
        if (trackedItem && trackedItem.genre_ids) {
            trackedItem.genre_ids.forEach(genreId => {
                genreCountsThisMonth[genreId] = (genreCountsThisMonth[genreId] || 0) + 1;
            });
        }
    });
    hoursWatchedThisMonth /= 60; // Convert minutes to hours

    const topGenresThisMonth = Object.entries(genreCountsThisMonth)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => Number(id));

    // --- All-time & Yearly stats ---
    let totalHoursWatched = 0;
    const genreCountsAllTime: Record<number, number> = {};
    const weeklyActivity = Array(7).fill(0); // 0: Sun, 1: Mon, ..., 6: Sat
    
    const historyThisYear = validHistory.filter(h => new Date(h.timestamp) >= thisYearStart);
    const episodesWatchedThisYear = historyThisYear.filter(h => h.media_type === 'tv').length;
    const moviesWatchedThisYear = historyThisYear.filter(h => h.media_type === 'movie').length;
    let hoursWatchedThisYear = 0;
    historyThisYear.forEach(h => {
        if (h.media_type === 'tv') hoursWatchedThisYear += 45;
        else hoursWatchedThisYear += 100;
    });
    hoursWatchedThisYear /= 60;
    
    validHistory.forEach(h => {
        if (h.media_type === 'tv') {
            totalHoursWatched += 45; 
        } else {
            totalHoursWatched += 100;
        }

        const watchDate = new Date(h.timestamp);
        weeklyActivity[watchDate.getDay()]++;

        const trackedItem = allTrackedItemsById.get(h.id);
        if (trackedItem && trackedItem.genre_ids) {
            trackedItem.genre_ids.forEach(genreId => {
                genreCountsAllTime[genreId] = (genreCountsAllTime[genreId] || 0) + 1;
            });
        }
    });
    totalHoursWatched /= 60;

    const topGenresAllTime = Object.entries(genreCountsAllTime)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => Number(id));

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDayIndex = weeklyActivity.indexOf(Math.max(...weeklyActivity));
    const mostActiveDay = weeklyActivity.every(v => v === 0) ? 'N/A' : daysOfWeek[mostActiveDayIndex];

    // --- Monthly Activity ---
    const monthlyActivityData: { month: string; count: number }[] = [];
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const month = date.getMonth();
        const year = date.getFullYear();
        const label = `${monthLabels[month]} '${String(year).slice(2)}`;
        
        const count = validHistory.filter(h => {
            const hDate = new Date(h.timestamp);
            return hDate.getMonth() === month && hDate.getFullYear() === year;
        }).length;
        
        monthlyActivityData.push({ month: label, count });
    }
    
    // --- New stats for achievements ---
    const ratedItemsCount = Object.keys(data.ratings).length;
    const customListsCount = data.customLists.length;
    const maxItemsInCustomList = data.customLists.length > 0 ? Math.max(0, ...data.customLists.map(l => l.items.length)) : 0;
    const distinctMoodsCount = Object.keys(moodDistribution).length;

    const extendedStats: CalculatedStats = {
      totalEpisodesWatched,
      nonManualEpisodesWatched,
      longestStreak,
      watchedThisWeek,
      journalCount,
      moodJournalCount,
      showsCompleted,
      moviesCompleted,
      totalItemsOnLists,
      watchedGenreCount,
      episodesWatchedToday,
      moviesWatchedToday,
      moviesWatchedThisWeek,
      hoursWatchedThisWeek: Math.round(hoursWatchedThisWeek),
      planToWatchCount,
      hoursWatchedThisMonth: Math.round(hoursWatchedThisMonth),
      topGenresThisMonth,
      genreDistributionThisMonth: genreCountsThisMonth,
      totalHoursWatched: Math.round(totalHoursWatched),
      showsWatchingCount,
      moviesToWatchCount,
      topGenresAllTime,
      genreDistributionAllTime: genreCountsAllTime,
      weeklyActivity,
      moodDistribution,
      monthlyActivity: monthlyActivityData,
      episodesWatchedThisMonth,
      moviesWatchedThisMonth,
      episodesWatchedThisYear,
      moviesWatchedThisYear,
      hoursWatchedThisYear: Math.round(hoursWatchedThisYear),
      mostActiveDay,
      ratedItemsCount,
      customListsCount,
      maxItemsInCustomList,
      distinctMoodsCount,
    };

    return extendedStats;
  }, [data]);
}