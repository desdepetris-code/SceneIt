import { Achievement } from './types';

export const allAchievements: Achievement[] = [
  // --- Watch Volume Milestones (Episodes) ---
  { id: 'episodes_100', name: 'Episode Enthusiast', description: 'Watch 100 total episodes. (Imports excluded)', difficulty: 'Easy', check: (d, s) => ({ progress: s.nonManualEpisodesWatched, goal: 100 }) },
  { id: 'episodes_250', name: 'Series Surveyor', description: 'Watch 250 total episodes. (Imports excluded)', difficulty: 'Easy', check: (d, s) => ({ progress: s.nonManualEpisodesWatched, goal: 250 }) },
  { id: 'episodes_500', name: 'Binge Baron', description: 'Watch 500 total episodes. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.nonManualEpisodesWatched, goal: 500 }) },
  { id: 'episodes_1000', name: 'TV Titan', description: 'Watch 1,000 total episodes. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.nonManualEpisodesWatched, goal: 1000 }) },
  { id: 'episodes_2500', name: 'Screen Sovereign', description: 'Watch 2,500 total episodes. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.nonManualEpisodesWatched, goal: 2500 }) },
  { id: 'episodes_5000', name: 'Episode Overlord', description: 'Watch 5,000 total episodes. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.nonManualEpisodesWatched, goal: 5000 }) },

  // --- Watch Volume Milestones (Movies) ---
  { id: 'movies_25', name: 'Moviegoer', description: 'Watch 25 different movies. (Imports excluded)', difficulty: 'Easy', check: (d, s) => ({ progress: s.moviesCompleted, goal: 25 }) },
  { id: 'movies_50', name: 'Film Fanatic', description: 'Watch 50 different movies. (Imports excluded)', difficulty: 'Easy', check: (d, s) => ({ progress: s.moviesCompleted, goal: 50 }) },
  { id: 'movies_100', name: 'Cinephile', description: 'Watch 100 different movies. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.moviesCompleted, goal: 100 }) },
  { id: 'movies_250', name: 'Cinema Centurion', description: 'Watch 250 different movies. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.moviesCompleted, goal: 250 }) },
  { id: 'movies_500', name: 'Film Archivist', description: 'Watch 500 different movies. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.moviesCompleted, goal: 500 }) },
  
  // --- Daily & Weekly Watch Goals ---
  { id: 'daily_episode_sprinter', name: 'Episode Sprinter', description: 'Watch 15 episodes in a single day. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.episodesWatchedToday, goal: 15 }) },
  { id: 'daily_movie_marathon', name: 'Movie Marathon', description: 'Watch 6 movies in a single day. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.moviesWatchedToday, goal: 6 }) },
  { id: 'daily_mixed_media', name: 'Mixed Media Day', description: 'Watch 10 episodes and 3 movies in a day. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: Math.min(s.episodesWatchedToday, 10) + Math.min(s.moviesWatchedToday, 3), goal: 13 }) },
  { id: 'weekly_binger', name: 'Weekly Binger', description: 'Watch 50 episodes within 7 days. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.watchedThisWeek, goal: 50 }) },
  { id: 'weekly_movie_collector', name: 'Movie Collector', description: 'Watch 12 movies within 7 days. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.moviesWatchedThisWeek, goal: 12 }) },
  { id: 'marathon_viewer', name: 'Marathon Viewer', description: 'Watch 20 episodes over a 7-day period. (Imports excluded)', difficulty: 'Easy', check: (d, s) => ({ progress: s.watchedThisWeek, goal: 20 }) },

  // --- Streak & Consistency ---
  { id: 'streak_starter', name: 'Streak Starter', description: 'Watch an episode on 5 consecutive days. (Imports excluded)', difficulty: 'Easy', check: (d, s) => ({ progress: s.longestStreak, goal: 5 }) },
  { id: 'week_streak', name: 'Week Streak', description: 'Maintain a 10-day watch streak. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.longestStreak, goal: 10 }) },
  { id: 'fortnight_fan', name: 'Fortnight Fan', description: 'Maintain a 14-day watch streak. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.longestStreak, goal: 14 }) },
  { id: 'dedication', name: 'Dedication', description: 'Achieve a 30-day watch streak. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.longestStreak, goal: 30 }) },
  { id: 'streak_master', name: 'Streak Master', description: 'Achieve a 50-day watch streak. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.longestStreak, goal: 50 }) },
  { id: 'streak_legend', name: 'Streak Legend', description: 'Achieve a 100-day watch streak. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.longestStreak, goal: 100 }) },
  { id: 'true_devotion', name: 'True Devotion', description: 'Achieve a 200-day watch streak. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.longestStreak, goal: 200 }) },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Achieve a 365-day watch streak. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.longestStreak, goal: 365 }) },

  // --- Engagement & Interaction ---
  { id: 'first_journal', name: 'The First of Many', description: 'Write your first journal entry for any episode or movie.', difficulty: 'Easy', check: (d, s) => ({ progress: s.journalCount, goal: 1 }) },
  { id: 'note_taker', name: 'Note Taker', description: 'Add journal entries to 10 different episodes.', difficulty: 'Easy', check: (d, s) => ({ progress: s.journalCount, goal: 10 }) },
  { id: 'mood_tracker', name: 'Mood Tracker', description: 'Use the mood tracker for 15 episodes.', difficulty: 'Easy', check: (d, s) => ({ progress: s.moodJournalCount, goal: 15 }) },
  { id: 'community_star', name: 'Community Star', description: 'Engage by adding notes to 40 episodes. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.journalCount, goal: 40 }) },
  { id: 'critic', name: 'Prolific Critic', description: 'Write 75 journal entries.', difficulty: 'Medium', check: (d, s) => ({ progress: s.journalCount, goal: 75 }) },
  { id: 'the_chronicler', name: 'The Chronicler', description: 'Write 150 journal entries.', difficulty: 'Hard', check: (d, s) => ({ progress: s.journalCount, goal: 150 }) },
  { id: 'the_critic_pro', name: 'The Critic Pro', description: 'Rate 50 different movies or shows.', difficulty: 'Medium', check: (d, s) => ({ progress: s.ratedItemsCount, goal: 50 }) },
  { id: 'rating_expert', name: 'Rating Expert', description: 'Rate 100 different movies or shows.', difficulty: 'Medium', check: (d, s) => ({ progress: s.ratedItemsCount, goal: 100 }) },
  { id: 'taste_maker', name: 'Taste Maker', description: 'Rate 250 different movies or shows.', difficulty: 'Hard', check: (d, s) => ({ progress: s.ratedItemsCount, goal: 250 }) },

  // --- Collection & Variety ---
  { id: 'genre_explorer', name: 'Genre Explorer', description: 'Watch shows or movies from 5 different genres.', difficulty: 'Easy', check: (d, s) => ({ progress: s.watchedGenreCount, goal: 5 }) },
  { id: 'watchlist_builder', name: 'Watchlist Builder', description: 'Add 30 shows/movies to your "Plan to Watch" list.', difficulty: 'Easy', check: (d, s) => ({ progress: s.planToWatchCount, goal: 30 }) },
  { id: 'eclectic_viewer', name: 'Eclectic Viewer', description: 'Watch 50 episodes across at least 8 genres. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: Math.min(s.nonManualEpisodesWatched / 50, 1) * 50 + Math.min(s.watchedGenreCount / 8, 1) * 50, goal: 100 }) },
  { id: 'genre_guru', name: 'Genre Guru', description: 'Watch shows or movies from 10 different genres.', difficulty: 'Medium', check: (d, s) => ({ progress: s.watchedGenreCount, goal: 10 }) },
  { id: 'genre_master', name: 'Genre Master', description: 'Watch shows or movies from 15 different genres.', difficulty: 'Hard', check: (d, s) => ({ progress: s.watchedGenreCount, goal: 15 }) },
  
  // --- Completion Milestones ---
  { id: 'series_starter', name: 'Series Starter', description: 'Finish your first TV show. (Imports excluded)', difficulty: 'Easy', check: (d, s) => ({ progress: s.showsCompleted, goal: 1 }) },
  { id: 'show_finisher', name: 'Show Finisher', description: 'Complete 5 different TV shows. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.showsCompleted, goal: 5 }) },
  { id: 'tv_tycoon', name: 'TV Tycoon', description: 'Complete 25 different TV shows. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.showsCompleted, goal: 25 }) },
  { id: 'series_veteran', name: 'Series Veteran', description: 'Complete 50 different TV shows. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.showsCompleted, goal: 50 }) },
  { id: 'show_supremo', name: 'Show Supremo', description: 'Complete 100 different TV shows. (Imports excluded)', difficulty: 'Hard', check: (d, s) => ({ progress: s.showsCompleted, goal: 100 }) },
  { id: 'season_completer', name: 'Season Completer', description: 'Finish your first season of any TV show.', difficulty: 'Easy', check: (d, s) => ({ progress: s.completedSeasonsCount || 0, goal: 1 }) },
  { id: 'seasoned_pro', name: 'Seasoned Pro', description: 'Complete 10 seasons across all shows.', difficulty: 'Medium', check: (d, s) => ({ progress: s.completedSeasonsCount || 0, goal: 10 }) },
  { id: 'binge_master', name: 'Binge Master', description: 'Complete 40 seasons across all shows.', difficulty: 'Hard', check: (d, s) => ({ progress: s.completedSeasonsCount || 0, goal: 40 }) },
  { id: 'season_conqueror', name: 'Season Conqueror', description: 'Complete 75 seasons across all shows.', difficulty: 'Hard', check: (d, s) => ({ progress: s.completedSeasonsCount || 0, goal: 75 }) },

  // --- Newly Added Achievements ---
  { id: 'the_critic', name: 'The Critic', description: 'Rate 25 different movies or shows.', difficulty: 'Easy', check: (d, s) => ({ progress: s.ratedItemsCount, goal: 25 }) },
  { id: 'curator', name: 'Curator', description: 'Create your first custom list.', difficulty: 'Easy', check: (d, s) => ({ progress: s.customListsCount, goal: 1 }) },
  { id: 'librarian', name: 'Librarian', description: 'Add 10 items to a single custom list.', difficulty: 'Easy', check: (d, s) => ({ progress: s.maxItemsInCustomList, goal: 10 }) },
  { id: 'emotional_rollercoaster', name: 'Emotional Rollercoaster', description: 'Use 5 different moods in your journal entries.', difficulty: 'Easy', check: (d, s) => ({ progress: s.distinctMoodsCount, goal: 5 }) },
  { id: 'double_feature', name: 'Double Feature', description: 'Watch 2 movies in a single day. (Imports excluded)', difficulty: 'Easy', check: (d, s) => ({ progress: s.moviesWatchedToday, goal: 2 }) },

  // --- More Achievements ---
  { id: 'collector', name: 'Collector', description: 'Create 5 custom lists.', difficulty: 'Medium', check: (d, s) => ({ progress: s.customListsCount, goal: 5 }) },
  { id: 'archivist', name: 'Archivist', description: 'Create 10 custom lists.', difficulty: 'Hard', check: (d, s) => ({ progress: s.customListsCount, goal: 10 }) },
  { id: 'mega_list', name: 'Mega List', description: 'Add 50 items to a single custom list.', difficulty: 'Medium', check: (d, s) => ({ progress: s.maxItemsInCustomList, goal: 50 }) },
  { id: 'giga_list', name: 'Giga List', description: 'Add 100 items to a single custom list.', difficulty: 'Hard', check: (d, s) => ({ progress: s.maxItemsInCustomList, goal: 100 }) },
  { id: 'moody', name: 'Moody', description: 'Use 10 different moods in your journal entries.', difficulty: 'Medium', check: (d, s) => ({ progress: s.distinctMoodsCount, goal: 10 }) },
  { id: 'triple_threat', name: 'Triple Threat', description: 'Watch 3 movies in a single day. (Imports excluded)', difficulty: 'Medium', check: (d, s) => ({ progress: s.moviesWatchedToday, goal: 3 }) },
  
  // Hours watched
  { id: 'hours_100', name: 'Time Well Spent', description: 'Watch 100 hours of content. (Imports excluded)', difficulty: 'Easy', check: (d,s) => ({ progress: s.totalHoursWatched, goal: 100 })},
  { id: 'hours_250', name: 'Couch Potato', description: 'Watch 250 hours of content. (Imports excluded)', difficulty: 'Medium', check: (d,s) => ({ progress: s.totalHoursWatched, goal: 250 })},
  { id: 'hours_500', name: 'Screen Fiend', description: 'Watch 500 hours of content. (Imports excluded)', difficulty: 'Medium', check: (d,s) => ({ progress: s.totalHoursWatched, goal: 500 })},
  { id: 'hours_1000', name: 'Time Lord', description: 'Watch 1,000 hours of content. (Imports excluded)', difficulty: 'Hard', check: (d,s) => ({ progress: s.totalHoursWatched, goal: 1000 })},
  { id: 'hours_2000', name: 'Eternity Viewer', description: 'Watch 2,000 hours of content. (Imports excluded)', difficulty: 'Hard', check: (d,s) => ({ progress: s.totalHoursWatched, goal: 2000 })},
  
  // Genre Mastery (Easy)
  { id: 'genre_comedy_1', name: 'Comedy Apprentice', description: 'Watch 25 Comedies. (Imports excluded)', difficulty: 'Easy', check: (d,s) => ({ progress: s.genreDistributionAllTime[35] || 0, goal: 25 })},
  { id: 'genre_drama_1', name: 'Drama Dabbler', description: 'Watch 25 Dramas. (Imports excluded)', difficulty: 'Easy', check: (d,s) => ({ progress: s.genreDistributionAllTime[18] || 0, goal: 25 })},
  { id: 'genre_action_1', name: 'Action Aspirant', description: 'Watch 25 Action titles. (Imports excluded)', difficulty: 'Easy', check: (d,s) => ({ progress: s.genreDistributionAllTime[28] || 0, goal: 25 })},
  { id: 'genre_scifi_1', name: 'Sci-Fi Scout', description: 'Watch 25 Sci-Fi titles. (Imports excluded)', difficulty: 'Easy', check: (d,s) => ({ progress: s.genreDistributionAllTime[878] || 0, goal: 25 })},
  { id: 'genre_horror_1', name: 'Horror Hound', description: 'Watch 25 Horror titles. (Imports excluded)', difficulty: 'Easy', check: (d,s) => ({ progress: s.genreDistributionAllTime[27] || 0, goal: 25 })},
  { id: 'genre_romance_1', name: 'Romance Rookie', description: 'Watch 25 Romances. (Imports excluded)', difficulty: 'Easy', check: (d,s) => ({ progress: s.genreDistributionAllTime[10749] || 0, goal: 25 })},
  { id: 'genre_animation_1', name: 'Animation Admirer', description: 'Watch 25 Animations. (Imports excluded)', difficulty: 'Easy', check: (d,s) => ({ progress: s.genreDistributionAllTime[16] || 0, goal: 25 })},
  
  // Genre Mastery (Medium)
  { id: 'genre_comedy_2', name: 'Comedy Connoisseur', description: 'Watch 75 Comedies. (Imports excluded)', difficulty: 'Medium', check: (d,s) => ({ progress: s.genreDistributionAllTime[35] || 0, goal: 75 })},
  { id: 'genre_drama_2', name: 'Drama Devotee', description: 'Watch 75 Dramas. (Imports excluded)', difficulty: 'Medium', check: (d,s) => ({ progress: s.genreDistributionAllTime[18] || 0, goal: 75 })},
  { id: 'genre_action_2', name: 'Action Aficionado', description: 'Watch 75 Action titles. (Imports excluded)', difficulty: 'Medium', check: (d,s) => ({ progress: s.genreDistributionAllTime[28] || 0, goal: 75 })},
  { id: 'genre_scifi_2', name: 'Sci-Fi Specialist', description: 'Watch 75 Sci-Fi titles. (Imports excluded)', difficulty: 'Medium', check: (d,s) => ({ progress: s.genreDistributionAllTime[878] || 0, goal: 75 })},
  
  // Specific show types
  { id: 'long_runner', name: 'Long Runner', description: 'Complete a TV show with over 100 episodes.', difficulty: 'Medium', check: (d,s) => ({ progress: 0, goal: 1 })}, // Note: requires more complex check logic
  { id: 'epic_saga', name: 'Epic Saga', description: 'Complete a TV show with 10 or more seasons.', difficulty: 'Hard', check: (d,s) => ({ progress: 0, goal: 1 })}, // Note: requires more complex check logic
  
  // Time travel
  { id: 'decade_60s', name: 'Swinging Sixties', description: 'Watch a movie released in the 1960s.', difficulty: 'Easy', check: (d,s) => ({ progress: 0, goal: 1})},
  { id: 'decade_70s', name: 'Funky Seventies', description: 'Watch a movie released in the 1970s.', difficulty: 'Easy', check: (d,s) => ({ progress: 0, goal: 1})},
  { id: 'decade_80s', name: 'Awesome Eighties', description: 'Watch a movie released in the 1980s.', difficulty: 'Easy', check: (d,s) => ({ progress: 0, goal: 1})},
  { id: 'decade_90s', name: 'Nostalgic Nineties', description: 'Watch a movie released in the 1990s.', difficulty: 'Easy', check: (d,s) => ({ progress: 0, goal: 1})},
  
  // Special Days
  { id: 'new_year_watch', name: 'New Year, New Show', description: 'Watch something on New Year\'s Day (Jan 1st).', difficulty: 'Easy', check: (d,s) => ({ progress: 0, goal: 1})},
  { id: 'halloween_watch', name: 'Spooky Session', description: 'Watch something on Halloween (Oct 31st).', difficulty: 'Easy', check: (d,s) => ({ progress: 0, goal: 1})},
  { id: 'christmas_watch', name: 'Festive Flix', description: 'Watch something on Christmas Day (Dec 25th).', difficulty: 'Easy', check: (d,s) => ({ progress: 0, goal: 1})},

  // More interaction
  { id: 'favorite_show', name: 'Got a Favorite?', description: 'Add your first item to Favorites.', difficulty: 'Easy', check: (d,s) => ({ progress: d.favorites.length, goal: 1})},
  { id: 'favorite_collection', name: 'Top Tier', description: 'Add 10 items to your Favorites list.', difficulty: 'Medium', check: (d,s) => ({ progress: d.favorites.length, goal: 10})},
  { id: 'favorite_episode', name: 'That One Scene', description: 'Mark an episode as a favorite.', difficulty: 'Easy', check: (d,s) => ({ progress: Object.keys(d.favoriteEpisodes).length, goal: 1})},
  // FIX: Explicitly type reduce accumulators to prevent type inference issues.
  { id: 'episode_connoisseur', name: 'Episode Connoisseur', description: 'Mark 20 episodes as favorites.', difficulty: 'Medium', check: (d,s) => ({ progress: Object.values(d.favoriteEpisodes).reduce((acc: number, seasons) => acc + Object.values(seasons).reduce((sAcc: number, eps) => sAcc + Object.keys(eps).length, 0), 0), goal: 20})},
  { id: 'first_rating', name: 'First Opinion', description: 'Rate any movie or show.', difficulty: 'Easy', check: (d,s) => ({ progress: s.ratedItemsCount, goal: 1})},
  { id: 'episode_rater', name: 'Episode Rater', description: 'Rate 10 individual episodes.', difficulty: 'Easy', check: (d,s) => ({ progress: Object.values(d.episodeRatings).reduce((acc: number, seasons) => acc + Object.values(seasons).reduce((sAcc: number, eps) => sAcc + Object.keys(eps).length, 0), 0), goal: 10})},
  { id: 'prolific_episode_rater', name: 'Detailed Critic', description: 'Rate 50 individual episodes.', difficulty: 'Medium', check: (d,s) => ({ progress: Object.values(d.episodeRatings).reduce((acc: number, seasons) => acc + Object.values(seasons).reduce((sAcc: number, eps) => sAcc + Object.keys(eps).length, 0), 0), goal: 50})},
];