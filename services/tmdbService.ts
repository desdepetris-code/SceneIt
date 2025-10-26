import { TMDB_API_BASE_URL, TMDB_API_KEY } from '../constants';
// FIX: Import PersonDetails type for the new getPersonDetails function.
import { TmdbMedia, TmdbMediaDetails, TmdbSeasonDetails, WatchProviderResponse, TmdbCollection, TmdbFindResponse, PersonDetails } from '../types';
import { getFromCache, setToCache } from '../utils/cacheUtils';

// --- Caching Logic ---
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_TTL_SHORT = 6 * 60 * 60 * 1000; // 6 hours

// A lightweight version of show details specifically for the "New Seasons" cache.
// This prevents exceeding localStorage quota by only storing what's needed for that component.
interface CachedNewSeasonShow {
  id: number;
  name?: string;
  last_episode_to_air?: {
      air_date: string;
      season_number: number;
  } | null;
  seasons?: {
      season_number: number;
      name: string;
  }[];
}


export const clearMediaCache = (id: number, mediaType: 'tv' | 'movie'): void => {
    const cacheKey = `tmdb_details_v4_${mediaType}_${id}`;
    try {
        localStorage.removeItem(cacheKey);
        console.log(`Cleared TMDB cache for ${mediaType} ${id}`);
    } catch (error) {
        console.error("Error clearing TMDB cache", error);
    }
}
// --- End Caching Logic ---

const fetchFromTmdb = async <T,>(endpoint: string, method: 'GET' | 'POST' = 'GET', body: object | null = null, extraParams: string = ''): Promise<T> => {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${TMDB_API_BASE_URL}/${endpoint}${separator}api_key=${TMDB_API_KEY}${extraParams}`;
  const options: RequestInit = {
    method,
    headers: {
      'accept': 'application/json',
      'content-type': method === 'POST' ? 'application/json' : 'text/plain', // Adjust content-type header
    }
  };
  
  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    let message = 'Failed to fetch data from TMDB';
    try {
        const errorData = await response.json();
        if (errorData && errorData.status_message) {
            message = `TMDB Error: ${errorData.status_message}`;
        }
    } catch(e) {
        // Could not parse error JSON, stick with the default message
    }
    throw new Error(message);
  }
  
  const data = await response.json();
  // Handle cases where the API returns 200 OK but with a failure message in the body
  if (data.success === false) {
    throw new Error(`TMDB Error: ${data.status_message || 'The resource you requested could not be found.'}`);
  }

  return data;
};

export const searchMedia = async (query: string): Promise<TmdbMedia[]> => {
    if (!query) return [];

    const yearRegex = /\b(19|20)\d{2}\b/;
    const yearMatch = query.match(yearRegex);

    if (yearMatch) {
        const year = yearMatch[0];
        const titleQuery = query.replace(yearRegex, '').trim();

        if (!titleQuery) {
            return [];
        }

        const [movieResults, tvResults] = await Promise.all([
            fetchFromTmdb<{ results: TmdbMedia[] }>(`search/movie?query=${encodeURIComponent(titleQuery)}&primary_release_year=${year}`),
            fetchFromTmdb<{ results: TmdbMedia[] }>(`search/tv?query=${encodeURIComponent(titleQuery)}&first_air_date_year=${year}`)
        ]);

        const moviesWithMediaType = movieResults.results.map(item => ({ ...item, media_type: 'movie' as const }));
        const tvWithMediaType = tvResults.results.map(item => ({ ...item, media_type: 'tv' as const }));

        const combinedResults = [...moviesWithMediaType, ...tvWithMediaType];
        
        // Sort by popularity to interleave movies and tv shows
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        combinedResults.sort((a: any, b: any) => b.popularity - a.popularity);

        return combinedResults;

    } else {
        // Original logic for searches without a year
        const data = await fetchFromTmdb<{ results: (TmdbMedia & { media_type: 'movie' | 'tv' | 'person' })[] }>(`search/multi?query=${encodeURIComponent(query)}`);
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    }
};

export const findByImdbId = async (imdbId: string): Promise<TmdbFindResponse> => {
    const cacheKey = `tmdb_find_${imdbId}`;
    const cachedData = getFromCache<TmdbFindResponse>(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const data = await fetchFromTmdb<TmdbFindResponse>(`find/${imdbId}?external_source=imdb_id`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getMediaDetails = async (id: number, mediaType: 'tv' | 'movie'): Promise<TmdbMediaDetails> => {
  const cacheKey = `tmdb_details_v4_${mediaType}_${id}`;
  const cachedData = getFromCache<TmdbMediaDetails>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let endpoint = `${mediaType}/${id}`;
  if (mediaType === 'tv') {
    endpoint += `?append_to_response=images,recommendations,external_ids,credits,videos`;
  } else {
    endpoint += `?append_to_response=images,recommendations,credits,videos,external_ids`;
  }

  const data = await fetchFromTmdb<TmdbMediaDetails>(endpoint);
  setToCache(cacheKey, data, CACHE_TTL);
  return data;
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number): Promise<TmdbSeasonDetails> => {
  const cacheKey = `tmdb_season_${tvId}_${seasonNumber}`;
  const cachedData = getFromCache<TmdbSeasonDetails>(cacheKey);
  if(cachedData) {
      return cachedData;
  }
  const data = await fetchFromTmdb<TmdbSeasonDetails>(`tv/${tvId}/season/${seasonNumber}`);
  // Inject season_number into each episode
  data.episodes = data.episodes.map(episode => ({
    ...episode,
    season_number: seasonNumber,
  }));
  setToCache(cacheKey, data, CACHE_TTL);
  return data;
};

interface Genre {
  id: number;
  name: string;
}

export const getGenres = async (): Promise<Record<number, string>> => {
  const cacheKey = 'tmdb_genres_v2';
  const cachedData = getFromCache<Record<number, string>>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const [tvGenres, movieGenres] = await Promise.all([
    fetchFromTmdb<{ genres: Genre[] }>('genre/tv/list'),
    fetchFromTmdb<{ genres: Genre[] }>('genre/movie/list'),
  ]);

  const allGenres = new Map<number, string>();
  [...tvGenres.genres, ...movieGenres.genres].forEach(genre => {
    allGenres.set(genre.id, genre.name);
  });
  
  const genreMap = Object.fromEntries(allGenres);
  setToCache(cacheKey, genreMap, CACHE_TTL);
  return genreMap;
};

export const getTrending = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`trending/${mediaType}/week`);
    return data.results.map(item => ({...item, media_type: mediaType}));
}

export const getNewReleases = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const endpoint = mediaType === 'tv' ? 'tv/on_the_air' : 'movie/now_playing';
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(endpoint);
    return data.results.map(item => ({...item, media_type: mediaType}));
};

export const getPopularShowsAllTime = async (): Promise<TmdbMedia[]> => {
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>('discover/tv?sort_by=popularity.desc');
    return data.results.map(item => ({...item, media_type: 'tv'}));
};

export const getNewSeasons = async (): Promise<TmdbMediaDetails[]> => {
    const cacheKey = 'tmdb_new_seasons_v2';
    const cachedData = getFromCache<CachedNewSeasonShow[]>(cacheKey);
    if (cachedData) {
        // The component expects TmdbMediaDetails[], but it only uses a subset of properties.
        // Casting the lightweight cached object is safe and avoids changing the component.
        return cachedData as TmdbMediaDetails[];
    }

    try {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const params = `&air_date.gte=${formatDate(sevenDaysAgo)}&air_date.lte=${formatDate(today)}&sort_by=popularity.desc`;

        const pagePromises = [1, 2, 3, 4, 5].map(page => 
            fetchFromTmdb<{ results: TmdbMedia[] }>(`discover/tv?page=${page}${params}`)
        );

        const pageResults = await Promise.all(pagePromises);
        const allShows = pageResults.flatMap(page => page.results);

        const uniqueShowIds = Array.from(new Set(allShows.map(show => show.id)));
        
        const detailPromises = uniqueShowIds.map(id => getMediaDetails(id, 'tv').catch(() => null));
        let detailedShows = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => d !== null);

        const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();

        // Filter for shows that had an episode air in the last 7 days
        detailedShows = detailedShows.filter(show => {
            const lastEp = show.last_episode_to_air;
            if (!lastEp || !lastEp.air_date) return false;

            // Use T00:00:00 to avoid timezone issues when comparing dates
            const airDate = new Date(lastEp.air_date + 'T00:00:00').getTime();
            
            // Check if the last aired episode was within the last 7 days.
            return airDate >= sevenDaysAgoTimestamp;
        });

        // Final sort by the most recent air date
        detailedShows.sort((a, b) => {
            const dateA = new Date(a.last_episode_to_air?.air_date || 0).getTime();
            const dateB = new Date(b.last_episode_to_air?.air_date || 0).getTime();
            return dateB - dateA;
        });
        
        // Create a lightweight version of the data for caching to avoid storage quota errors.
        const dataToCache: CachedNewSeasonShow[] = detailedShows.map(show => ({
            id: show.id,
            name: show.name,
            last_episode_to_air: show.last_episode_to_air ? {
                air_date: show.last_episode_to_air.air_date,
                season_number: show.last_episode_to_air.season_number,
            } : null,
            seasons: show.seasons?.map(s => ({
                season_number: s.season_number,
                name: s.name,
            })),
        }));

        setToCache(cacheKey, dataToCache, CACHE_TTL_SHORT);
        
        return detailedShows;

    } catch (error) {
        console.error("Failed to fetch new seasons/premieres:", error);
        return [];
    }
};


export const discoverMedia = async (
    mediaType: 'tv' | 'movie', 
    filters: { genre?: number; year?: number; sortBy?: string; vote_count_gte?: number }
): Promise<TmdbMedia[]> => {
    let endpoint = `discover/${mediaType}?sort_by=${filters.sortBy || 'popularity.desc'}`;
    if (filters.genre) {
        endpoint += `&with_genres=${filters.genre}`;
    }
    if (filters.year) {
        const yearKey = mediaType === 'tv' ? 'first_air_date_year' : 'primary_release_year';
        endpoint += `&${yearKey}=${filters.year}`;
    }
    if (filters.vote_count_gte) {
        endpoint += `&vote_count.gte=${filters.vote_count_gte}`;
    }
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(endpoint);
    return data.results.map(item => ({...item, media_type: mediaType}));
};

export const discoverMediaPaginated = async (
    mediaType: 'tv' | 'movie', 
    filters: { genre?: number; year?: number; sortBy?: string; vote_count_gte?: number },
    page: number = 1
): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    let endpoint = `discover/${mediaType}?sort_by=${filters.sortBy || 'popularity.desc'}&page=${page}`;
    if (filters.genre) {
        endpoint += `&with_genres=${filters.genre}`;
    }
    if (filters.year) {
        const yearKey = mediaType === 'tv' ? 'first_air_date_year' : 'primary_release_year';
        endpoint += `&${yearKey}=${filters.year}`;
    }
    if (filters.vote_count_gte) {
        endpoint += `&vote_count.gte=${filters.vote_count_gte}`;
    }
    const data = await fetchFromTmdb<{ results: TmdbMedia[], total_pages: number }>(endpoint);
    return {
        results: data.results.map(item => ({...item, media_type: mediaType})),
        total_pages: data.total_pages
    };
};

export const getUpcomingMovies = async (): Promise<TmdbMedia[]> => {
    const endpoint = 'movie/upcoming';
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(endpoint);
    return data.results.map(item => ({...item, media_type: 'movie'}));
};

export const getWatchProviders = async (id: number, mediaType: 'tv' | 'movie'): Promise<WatchProviderResponse> => {
    const cacheKey = `tmdb_providers_${mediaType}_${id}`;
    const cachedData = getFromCache<WatchProviderResponse>(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const data = await fetchFromTmdb<WatchProviderResponse>(`${mediaType}/${id}/watch/providers`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
}

export const getCollectionDetails = async (collectionId: number): Promise<TmdbCollection> => {
    const cacheKey = `tmdb_collection_${collectionId}`;
    const cachedData = getFromCache<TmdbCollection>(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const data = await fetchFromTmdb<TmdbCollection>(`collection/${collectionId}`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

// FIX: Add getPersonDetails function to fetch actor details from TMDB.
export const getPersonDetails = async (personId: number): Promise<PersonDetails> => {
    const cacheKey = `tmdb_person_${personId}`;
    const cachedData = getFromCache<PersonDetails>(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const endpoint = `person/${personId}?append_to_response=combined_credits,images`;
    const data = await fetchFromTmdb<PersonDetails>(endpoint);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};