import { TmdbMediaDetails } from '../types';

interface RatingInfo {
  rating: string;
  colorClass: string;
}

export const getRating = (details: TmdbMediaDetails): RatingInfo | null => {
  let rating: string | undefined;

  if (details.media_type === 'movie') {
    const usRelease = details.release_dates?.results.find(r => r.iso_3166_1 === 'US');
    if (usRelease) {
      // Find the theatrical release (type 3) first, or any with a certification.
      const theatricalRelease = usRelease.release_dates.find(rd => rd.type === 3 && rd.certification);
      if (theatricalRelease) {
        rating = theatricalRelease.certification;
      } else {
        const firstRated = usRelease.release_dates.find(rd => rd.certification);
        if (firstRated) {
          rating = firstRated.certification;
        }
      }
    }
  } else if (details.media_type === 'tv') {
    const usRating = details.content_ratings?.results.find(r => r.iso_3166_1 === 'US');
    rating = usRating?.rating;
  }

  if (!rating || rating === "NR" || rating === "") {
    return null;
  }

  let colorClass = 'bg-gray-500/20 text-gray-300'; // Default/unknown

  const r = rating.toUpperCase();
  if (['G', 'TV-Y', 'TV-Y7', 'TV-G'].includes(r)) {
    colorClass = 'bg-green-500/20 text-green-300';
  } else if (['PG', 'TV-PG', 'PG-13', 'TV-14'].includes(r)) {
    colorClass = 'bg-yellow-500/20 text-yellow-300';
  } else if (['R', 'NC-17', 'TV-MA'].includes(r)) {
    colorClass = 'bg-red-500/20 text-red-300';
  }

  return { rating, colorClass };
};
