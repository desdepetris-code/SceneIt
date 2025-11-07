import { Episode, TmdbMediaDetails, TmdbSeasonDetails, EpisodeTag } from '../types';

export function getEpisodeTag(
  episode: Episode,
  season: TmdbMediaDetails['seasons'][0] | undefined,
  showDetails: TmdbMediaDetails,
  seasonDetails: TmdbSeasonDetails | undefined
): EpisodeTag | null {
  if (!season || season.season_number === 0) return null; // No tags for specials

  let tagText: string | null = null;
  let className = 'bg-gray-600 text-white';

  // --- Priority 1: Explicit finale types from TMDb ---
  if (episode.episode_type === 'series_finale') {
    tagText = "Series Finale";
    className = 'bg-black text-white';
  } else if (episode.episode_type === 'season_finale') {
    tagText = "Season Finale";
    className = 'bg-red-600 text-white';
  } else if (episode.episode_type === 'midseason_finale') {
    tagText = "Mid-Season Finale";
    className = 'bg-orange-600 text-white';
  }

  // --- Priority 2: Premiere Logic ---
  // If no finale tag was found, check if it's a premiere.
  if (!tagText && episode.episode_number === 1) {
    if (season.season_number === 1) {
      tagText = "Series Premiere";
      className = 'bg-purple-600 text-white';
    } else {
      tagText = "Season Premiere";
      className = 'bg-blue-600 text-white';
    }
  }
  
  // --- Priority 3: Fallback heuristic for finales ---
  // This logic is applied only if no explicit tag was found from TMDb or premiere logic.
  if (!tagText && seasonDetails && episode.episode_number === seasonDetails.episodes.length) {
    const isLatestSeason = season.season_number === showDetails.number_of_seasons;

    // Heuristic for Series Finale is generally safe to apply.
    if (isLatestSeason && showDetails.status === 'Ended') {
        tagText = "Series Finale";
        className = 'bg-black text-white';
    } else if (!isLatestSeason) {
        // For past seasons, it's safe to assume the last episode is the finale.
        tagText = "Season Finale";
        className = 'bg-red-600 text-white';
    }
    // If it's the latest season of an ongoing show, we do NOT apply the heuristic,
    // as TMDB might not have marked the finale yet. This prevents incorrect tagging.
  }

  if (tagText) {
    return { text: tagText, className };
  }

  return null;
}
