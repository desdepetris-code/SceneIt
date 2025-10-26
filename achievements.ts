import { Achievement } from './types';

export const allAchievements: Achievement[] = [
  // --- New Easy Achievements ---
  {
    id: 'first_journal',
    name: 'The First of Many',
    description: 'Write your first journal entry for any episode or movie.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.journalCount,
      goal: 1,
    }),
  },
  {
    id: 'movie_buff',
    name: 'Movie Buff',
    description: 'Mark 10 different movies as "Completed".',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.moviesCompleted,
      goal: 10,
    }),
  },
  {
    id: 'series_starter',
    name: 'Series Starter',
    description: 'Finish your first TV show by marking all episodes as watched.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.showsCompleted,
      goal: 1,
    }),
  },
  
  // --- Daily Watch Goals ---
  {
    id: 'daily_episode_sprinter',
    name: 'Episode Sprinter',
    description: 'Watch 15 episodes in a single day. Reward: VIP Pass (24h). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.episodesWatchedToday,
      goal: 15,
    }),
  },
  {
    id: 'daily_movie_marathon',
    name: 'Movie Marathon',
    description: 'Watch 6 movies in a single day. Reward: VIP Pass (3 Days). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.moviesWatchedToday,
      goal: 6,
    }),
  },
  {
    id: 'daily_mixed_media',
    name: 'Mixed Media Day',
    description: 'Watch 10 episodes and 3 movies in a day. Reward: VIP Pass (2 Days). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => {
        const episodeProgress = Math.min(stats.episodesWatchedToday / 10, 1);
        const movieProgress = Math.min(stats.moviesWatchedToday / 3, 1);
        const totalProgress = Math.floor(((episodeProgress + movieProgress) / 2) * 100);
        return { progress: totalProgress, goal: 100 };
    },
  },

  // --- Weekly Watch Goals ---
  {
    id: 'weekly_binger',
    name: 'Weekly Binger',
    description: 'Watch 50 episodes within 7 days. Reward: VIP Pass (3 Days). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.watchedThisWeek,
      goal: 50,
    }),
  },
  {
    id: 'weekly_movie_collector',
    name: 'Movie Collector',
    description: 'Watch 12 movies within 7 days. Reward: VIP Pass (7 Days). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.moviesWatchedThisWeek,
      goal: 12,
    }),
  },
  {
    id: 'weekly_mixed_media',
    name: 'Mixed Media Week',
    description: 'Watch 35 episodes and 7 movies in a week. Reward: VIP Pass (1 Month). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => {
        const episodeProgress = Math.min(stats.watchedThisWeek / 35, 1);
        const movieProgress = Math.min(stats.moviesWatchedThisWeek / 7, 1);
        const totalProgress = Math.floor(((episodeProgress + movieProgress) / 2) * 100);
        return { progress: totalProgress, goal: 100 };
    },
  },

  // --- Streak & Consistency ---
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Watch an episode on 5 consecutive days.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.longestStreak,
      goal: 5,
    }),
  },
  {
    id: 'week_streak',
    name: 'Week Streak',
    description: 'Maintain a 10-day watch streak.',
    difficulty: 'Medium',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.longestStreak,
      goal: 10,
    }),
  },
    {
    id: 'marathon_viewer',
    name: 'Marathon Viewer',
    description: 'Watch 20 episodes over a 7-day period.',
    difficulty: 'Medium',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.watchedThisWeek,
      goal: 20,
    }),
  },
  {
    id: 'dedication',
    name: 'Dedication',
    description: 'Achieve a 30-day watch streak. Reward: VIP Pass (1 Week). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.longestStreak,
      goal: 30,
    }),
  },
  
  // --- Engagement & Interaction ---
  {
    id: 'note_taker',
    name: 'Note Taker',
    description: 'Add journal entries to 10 different episodes.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.journalCount,
      goal: 10,
    }),
  },
  {
    id: 'mood_tracker',
    name: 'Mood Tracker',
    description: 'Use the mood tracker for 15 episodes.',
    difficulty: 'Medium',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.moodJournalCount,
      goal: 15,
    }),
  },
    {
    id: 'critic',
    name: 'Prolific Critic',
    description: 'Write 75 journal entries. Reward: VIP Pass (48h).',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
        progress: stats.journalCount,
        goal: 75,
    }),
  },
  {
    id: 'community_star',
    name: 'Community Star',
    description: 'Engage by adding notes to 40 episodes. Reward: VIP Pass (48h). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
        progress: stats.journalCount,
        goal: 40,
    }),
  },

  // --- Collection & Variety ---
  {
    id: 'genre_explorer',
    name: 'Genre Explorer',
    description: 'Watch shows or movies from 5 different genres.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
        progress: stats.watchedGenreCount,
        goal: 5,
    }),
  },
    {
    id: 'watchlist_builder',
    name: 'Watchlist Builder',
    description: 'Add 30 shows/movies to your "Plan to Watch" list.',
    difficulty: 'Medium',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
        progress: stats.planToWatchCount,
        goal: 30,
    }),
  },
  {
    id: 'eclectic_viewer',
    name: 'Eclectic Viewer',
    description: 'Watch 50 episodes across at least 8 genres. Reward: VIP Pass (1 Week). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => {
        const episodeProgress = Math.min(stats.totalEpisodesWatched / 50, 1);
        const genreProgress = Math.min(stats.watchedGenreCount / 8, 1);
        const totalProgress = Math.floor(((episodeProgress + genreProgress) / 2) * 100);
        return { progress: totalProgress, goal: 100 };
    },
  },
  
  // --- Season Completion Milestones ---
  {
    id: 'season_completer',
    name: 'Season Completer',
    description: 'Finish your first season of any TV show.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.completedSeasonsCount || 0,
      goal: 1,
    }),
  },
  {
    id: 'seasoned_pro',
    name: 'Seasoned Pro',
    description: 'Complete 10 seasons across all shows. Reward: VIP Pass (3 Days).',
    difficulty: 'Medium',
    reward: 'vipPass',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.completedSeasonsCount || 0,
      goal: 10,
    }),
  },
  {
    id: 'binge_master',
    name: 'Binge Master',
    description: 'Complete 40 seasons across all shows. Reward: VIP Pass (1 Week).',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.completedSeasonsCount || 0,
      goal: 40,
    }),
  },

  // --- New Completion Milestones ---
  {
    id: 'tv_tycoon',
    name: 'TV Tycoon',
    description: 'Complete 25 different TV shows.',
    difficulty: 'Medium',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.showsCompleted,
      goal: 25,
    }),
  },
  {
    id: 'movie_maniac',
    name: 'Movie Maniac',
    description: 'Complete 75 different movies.',
    difficulty: 'Medium',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.moviesCompleted,
      goal: 75,
    }),
  },
  {
    id: 'century_movies',
    name: 'Century Club',
    description: 'Complete 150 movies. Reward: VIP Pass (1 Week). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.moviesCompleted,
      goal: 150,
    }),
  },
  {
    id: 'tv_titan',
    name: 'TV Titan',
    description: 'Watch 1500 total episodes. Reward: VIP Pass (1 Month). (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.nonManualEpisodesWatched,
      goal: 1500,
    }),
  },
];