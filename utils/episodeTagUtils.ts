
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, EpisodeTag } from '../types';

export function getEpisodeTag(
  episode: Episode,
  season: TmdbMediaDetails['seasons'][0] | undefined,
  showDetails: TmdbMediaDetails,
  seasonDetails: TmdbSeasonDetails | undefined
): EpisodeTag | null {
  if (!season || season.season_number === 0) return null; // No tags for specials

  const isFirstEpisode = episode.episode_number === 1;
  const totalEpisodesInSeason = seasonDetails?.episodes?.length || season.episode_count;
  const isLastEpisode = episode.episode_number === totalEpisodesInSeason;

  let tagText: string | null = null;

  // Series Premiere (highest priority)
  if (season.season_number === 1 && isFirstEpisode) {
    tagText = "Series Premiere";
  } else {
      // Find last season of the show
      const lastSeason = [...(showDetails.seasons || [])]
        .filter(s => s.season_number > 0)
        .sort((a, b) => b.season_number - a.season_number)[0];

      // Series Finale
      if (showDetails.status === 'Ended' && season.season_number === lastSeason?.season_number && isLastEpisode) {
        tagText = "Series Finale";
      } else if (isFirstEpisode) {
        // Season Premiere
        tagText = "Season Premiere";
      } else if (isLastEpisode) {
        // Season Finale
        tagText = "Season Finale";
      }
  }

  if (tagText) {
    let className = 'bg-gray-600 text-white'; // default
    if (tagText === 'Series Premiere') className = 'bg-blue-600 text-white';
    if (tagText === 'Series Finale') className = 'bg-red-800 text-white';
    if (tagText === 'Season Premiere') className = 'bg-green-600 text-white';
    if (tagText === 'Season Finale') className = 'bg-orange-600 text-white';
    return { text: tagText, className };
  }

  return null;
}