import { Episode, TmdbMediaDetails, TmdbSeasonDetails, EpisodeTag } from '../types';

export function getEpisodeTag(
  episode: Episode,
  season: TmdbMediaDetails['seasons'][0] | undefined,
  showDetails: TmdbMediaDetails,
  seasonDetails: TmdbSeasonDetails | undefined
): EpisodeTag | null {
  if (!season || season.season_number === 0) return null; // No tags for specials

  const isFirstEpisode = episode.episode_number === 1;
  // Use seasonDetails if available for more accurate total, otherwise fallback to season summary
  const totalEpisodesInSeason = seasonDetails?.episodes?.length || season.episode_count;
  // Do not show finale tags if episode list is incomplete in the details
  const isLastEpisode = seasonDetails ? episode.episode_number === totalEpisodesInSeason : false;

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
    if (tagText === 'Series Premiere') className = 'bg-purple-600 text-white';
    if (tagText === 'Series Finale') className = 'bg-black text-white';
    if (tagText === 'Season Premiere') className = 'bg-blue-600 text-white';
    if (tagText === 'Season Finale') className = 'bg-red-600 text-white';
    return { text: tagText, className };
  }
  
  // --- Mid-season break detection ---
  // Only run this check if we have full season details and more than one episode.
  if (seasonDetails?.episodes && seasonDetails.episodes.length > 1) {
    const episodes = seasonDetails.episodes;
    const currentIndex = episodes.findIndex(ep => ep.id === episode.id);
    const breakThresholdDays = 21; // 3 weeks

    if (currentIndex !== -1) {
        // Check for Mid-Season Finale: break after this episode
        const nextEpisode = episodes[currentIndex + 1];
        if (nextEpisode && episode.air_date && nextEpisode.air_date) {
            const currentAirDate = new Date(episode.air_date);
            const nextAirDate = new Date(nextEpisode.air_date);
            const diffInMs = nextAirDate.getTime() - currentAirDate.getTime();
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

            if (diffInDays > breakThresholdDays) {
                return { text: 'Mid-Season Finale', className: 'bg-orange-700 text-white' };
            }
        }

        // Check for Mid-Season Premiere: break before this episode
        const prevEpisode = episodes[currentIndex - 1];
        if (prevEpisode && episode.air_date && prevEpisode.air_date) {
            const currentAirDate = new Date(episode.air_date);
            const prevAirDate = new Date(prevEpisode.air_date);
            const diffInMs = currentAirDate.getTime() - prevAirDate.getTime();
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

            if (diffInDays > breakThresholdDays) {
                return { text: 'Mid-Season Premiere', className: 'bg-amber-600 text-white' };
            }
        }
    }
  }


  return null;
}