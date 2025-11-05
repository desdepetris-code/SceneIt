import { TMDB_API_BASE_URL, TMDB_API_KEY } from '../constants';
import { TmdbMedia, TmdbMediaDetails, TmdbSeasonDetails, WatchProviderResponse, TmdbCollection, TmdbFindResponse, PersonDetails, TrackedItem, TmdbPerson, CalendarItem, NewlyPopularEpisode, Episode } from '../types';
import { getFromCache, setToCache } from '../utils/cacheUtils';

// --- Alias Map for Enhanced Search ---
const aliasMap: Record<string, string> = {
  "svu": "Law & Order: Special Victims Unit",
  "tbbt": "The Big Bang Theory",
  "oitnb": "Orange Is the New Black",
  "twd": "The Walking Dead",
  "got": "Game of Thrones",
  "bcs": "Better Call Saul",
  "ahs": "American Horror Story",
  "ds": "Demon Slayer",
  "jjk": "Jujutsu Kaisen",
  "aot": "Attack on Titan",
  "money heist": "La Casa de Papel",
};

// --- Caching Logic ---
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const CACHE_TTL_SHORT = 30 * 60 * 1000; // 30 minutes

// A lightweight version of show details specifically for the "New Seasons" cache.
// This prevents exceeding localStorage quota by only storing what's needed for that component.
interface CachedNewSeasonShow {
  id: number;
  name?: string;
  poster_path?: string | null;
  last_episode_to_air?: {
      air_date: string;
      season_number: number;
      episode_number: number;
      name: string;
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

    const normalizedQuery = query.toLowerCase().trim();
    const searchTerm = aliasMap[normalizedQuery] || query;

    const yearRegex = /\b(19|20)\d{2}\b/;
    const yearMatch = searchTerm.match(yearRegex);

    if (yearMatch) {
        const year = yearMatch[0];
        const titleQuery = searchTerm.replace(yearRegex, '').trim();

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
        const data = await fetchFromTmdb<{ results: (TmdbMedia & { media_type: 'movie' | 'tv' | 'person' })[] }>(`search/multi?query=${encodeURIComponent(searchTerm)}`);
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    }
};

export const searchMediaPaginated = async (
    query: string,
    page: number = 1
): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const normalizedQuery = query.toLowerCase().trim();
    const searchTerm = aliasMap[normalizedQuery] || query;
    const data = await fetchFromTmdb<{ results: (TmdbMedia & { media_type: 'movie' | 'tv' | 'person' })[], total_pages: number }>(`search/multi?query=${encodeURIComponent(searchTerm)}&page=${page}`);
    return {
        results: data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv'),
        total_pages: data.total_pages
    };
};

export const searchPeoplePaginated = async (
    query: string,
    page: number = 1
): Promise<{ results: TmdbPerson[], total_pages: number }> => {
    const data = await fetchFromTmdb<{ results: TmdbPerson[], total_pages: number }>(`search/person?query=${encodeURIComponent(query)}&page=${page}`);
    return data;
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

export const findByTvdbId = async (tvdbId: number): Promise<TmdbFindResponse> => {
    const cacheKey = `tmdb_find_tvdb_${tvdbId}`;
    const cachedData = getFromCache<TmdbFindResponse>(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const data = await fetchFromTmdb<TmdbFindResponse>(`find/${tvdbId}?external_source=tvdb_id`);
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
  // Note: Added include_image_language to prioritize English images.
  const imageLangParam = "include_image_language=en,null";
  if (mediaType === 'tv') {
    endpoint += `?append_to_response=images,recommendations,external_ids,credits,videos,content_ratings,aggregate_credits&${imageLangParam}`;
  } else {
    endpoint += `?append_to_response=images,recommendations,credits,videos,external_ids,release_dates&${imageLangParam}`;
  }

  const data = await fetchFromTmdb<TmdbMediaDetails>(endpoint);
  setToCache(cacheKey, data, CACHE_TTL);
  return data;
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number): Promise<TmdbSeasonDetails> => {
  const cacheKey = `tmdb_season_${tvId}_${seasonNumber}`;
  let cachedData = getFromCache<TmdbSeasonDetails>(cacheKey);

  if (cachedData) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setUTCDate(today.getUTCDate() - 3);

    const needsRefresh = cachedData.episodes.some(ep => {
      if (!ep.still_path && ep.air_date) {
        const airDate = new Date(ep.air_date); // Parses YYYY-MM-DD as UTC midnight
        return airDate >= threeDaysAgo && airDate <= today;
      }
      return false;
    });

    if (needsRefresh) {
      console.log(`Refreshing season ${seasonNumber} for show ${tvId} to get updated episode images.`);
      localStorage.removeItem(cacheKey);
      cachedData = null;
    }
  }

  if(cachedData) {
      return cachedData;
  }
  
  // Note: Added include_image_language to prioritize English images for episode stills.
  const data = await fetchFromTmdb<TmdbSeasonDetails>(`tv/${tvId}/season/${seasonNumber}?include_image_language=en,null`);
  // Inject season_number into each episode
  data.episodes = data.episodes.map(episode => ({
    ...episode,
    season_number: seasonNumber,
  }));
  setToCache(cacheKey, data, CACHE_TTL);
  return data;
};

export const getEpisodeDetails = async (tvId: number, seasonNumber: number, episodeNumber: number): Promise<Episode> => {
  const cacheKey = `tmdb_episode_details_${tvId}_${seasonNumber}_${episodeNumber}`;
  const cachedData = getFromCache<Episode>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  const data = await fetchFromTmdb<Episode>(`tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?append_to_response=credits`);
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
    fetchFromTmdb<{ genres: Genre[] }>('genre/movie/list')
  ]);
  
  const allGenres: Record<number, string> = {};
  tvGenres.genres.forEach(genre => allGenres[genre.id] = genre.name);
  movieGenres.genres.forEach(genre => allGenres[genre.id] = genre.name);

  setToCache(cacheKey, allGenres, CACHE_TTL * 12); // Genres change infrequently, cache for longer.
  return allGenres;
};

export const discoverMedia = async (
    mediaType: 'tv' | 'movie',
    filters: { sortBy?: string, genre?: number | string, year?: number, vote_count_gte?: number, vote_count_lte?: number, page?: number, 'first_air_date.gte'?: string, 'first_air_date.lte'?: string, 'primary_release_date.gte'?: string, 'primary_release_date.lte'?: string, 'with_keywords'?: string, region?: string, 'with_release_type'?: string }
): Promise<TmdbMedia[]> => {
    let params = `&sort_by=${filters.sortBy || 'popularity.desc'}`;
    if (filters.genre) params += `&with_genres=${filters.genre}`;
    if (filters.year) {
        if (mediaType === 'tv') params += `&first_air_date_year=${filters.year}`;
        else params += `&primary_release_year=${filters.year}`;
    }
    if(filters.vote_count_gte) params += `&vote_count.gte=${filters.vote_count_gte}`;
    if(filters.vote_count_lte) params += `&vote_count.lte=${filters.vote_count_lte}`;
    if(filters.page) params += `&page=${filters.page}`;
    if (filters['primary_release_date.gte']) params += `&primary_release_date.gte=${filters['primary_release_date.gte']}`;
    if (filters['primary_release_date.lte']) params += `&primary_release_date.lte=${filters['primary_release_date.lte']}`;
    if (filters['first_air_date.gte']) params += `&first_air_date.gte=${filters['first_air_date.gte']}`;
    if (filters['first_air_date.lte']) params += `&first_air_date.lte=${filters['first_air_date.lte']}`;
    if (filters['with_keywords']) params += `&with_keywords=${filters['with_keywords']}`;
    if (filters['with_release_type']) params += `&with_release_type=${filters['with_release_type']}`;
    if (filters.region) params += `&region=${filters.region}`;
    
    const cacheKey = `tmdb_discover_${mediaType}_v2_${params}`;
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if(cached) return cached;

    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`discover/${mediaType}?include_adult=false&language=en-US${params}`);
    const resultsWithMediaType = data.results.map(item => ({ ...item, media_type: mediaType }));

    setToCache(cacheKey, resultsWithMediaType, CACHE_TTL_SHORT);
    return resultsWithMediaType;
};

export const discoverMediaPaginated = async (
    mediaType: 'tv' | 'movie',
    filters: { sortBy?: string, genre?: number | string, year?: number, vote_count_gte?: number, vote_count_lte?: number, page?: number, 'first_air_date.gte'?: string, 'first_air_date.lte'?: string, 'primary_release_date.gte'?: string, 'primary_release_date.lte'?: string, 'with_keywords'?: string, region?: string, 'with_release_type'?: string }
): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    let params = `&sort_by=${filters.sortBy || 'popularity.desc'}`;
    if (filters.genre) params += `&with_genres=${filters.genre}`;
    if (filters.year) {
        if (mediaType === 'tv') params += `&first_air_date_year=${filters.year}`;
        else params += `&primary_release_year=${filters.year}`;
    }
    if(filters.vote_count_gte) params += `&vote_count.gte=${filters.vote_count_gte}`;
    if(filters.vote_count_lte) params += `&vote_count.lte=${filters.vote_count_lte}`;
    if(filters.page) params += `&page=${filters.page}`;
    if (filters['primary_release_date.gte']) params += `&primary_release_date.gte=${filters['primary_release_date.gte']}`;
    if (filters['primary_release_date.lte']) params += `&primary_release_date.lte=${filters['primary_release_date.lte']}`;
    if (filters['first_air_date.gte']) params += `&first_air_date.gte=${filters['first_air_date.gte']}`;
    if (filters['first_air_date.lte']) params += `&first_air_date.lte=${filters['first_air_date.lte']}`;
    if (filters['with_keywords']) params += `&with_keywords=${filters['with_keywords']}`;
    if (filters['with_release_type']) params += `&with_release_type=${filters['with_release_type']}`;
    if (filters.region) params += `&region=${filters.region}`;

    const cacheKey = `tmdb_discover_paginated_${mediaType}_v2_${params}`;
    const cached = getFromCache<{ results: TmdbMedia[], total_pages: number }>(cacheKey);
    if(cached) return cached;

    const data = await fetchFromTmdb<{ results: TmdbMedia[], total_pages: number }>(`discover/${mediaType}?include_adult=false&language=en-US${params}`);
    const resultsWithMediaType = data.results.map(item => ({ ...item, media_type: mediaType }));
    const response = { ...data, results: resultsWithMediaType };

    setToCache(cacheKey, response, CACHE_TTL_SHORT);
    return response;
};

export const getNewReleases = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const cacheKey = `tmdb_new_releases_v3_${mediaType}`;
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if(cached) return cached;
    
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = ninetyDaysAgo.toISOString().split('T')[0];

    const dateFilters = mediaType === 'tv'
        ? { 'first_air_date.gte': startDate, 'first_air_date.lte': today }
        : { 'primary_release_date.gte': startDate, 'primary_release_date.lte': today };

    const results = await discoverMedia(mediaType, { sortBy: 'popularity.desc', ...dateFilters });
    setToCache(cacheKey, results, CACHE_TTL_SHORT);
    return results;
};

export const getNewSeasons = async (forceRefresh: boolean, timezone: string): Promise<TmdbMediaDetails[]> => {
    const cacheKey = `tmdb_new_seasons_general_v2`;
    if (!forceRefresh) {
        const cached = getFromCache<TmdbMediaDetails[]>(cacheKey);
        if (cached) return cached;
    }

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const results = await discoverMedia('tv', { 
        sortBy: 'popularity.desc', 
        'first_air_date.gte': startDate, 
        'first_air_date.lte': today
    });

    const detailPromises = results.slice(0, 20).map(r => getMediaDetails(r.id, 'tv').catch(() => null));
    const detailedResults = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => d !== null);
    
    setToCache(cacheKey, detailedResults, CACHE_TTL_SHORT);
    return detailedResults;
};

export const getAllNewReleasesPaginated = async (
    page: number
): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = ninetyDaysAgo.toISOString().split('T')[0];

    const data = await fetchFromTmdb<{ results: TmdbMedia[], total_pages: number }>(
        `discover/movie?include_adult=false&language=en-US&primary_release_date.gte=${startDate}&primary_release_date.lte=${today}&sort_by=popularity.desc&page=${page}`
    );
    const moviesWithMediaType = data.results.map(item => ({ ...item, media_type: 'movie' as const }));
    return { ...data, results: moviesWithMediaType };
};

export const getUpcomingTvPremieres = async (page: number, startDateOverride?: string): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const endDate = ninetyDaysFromNow.toISOString().split('T')[0];

    const data = await discoverMediaPaginated('tv', {
        page,
        sortBy: 'first_air_date.asc',
        'first_air_date.gte': startDateOverride || today,
        'first_air_date.lte': endDate,
    });
    return data;
};

export const getUpcomingMovieReleases = async (page: number): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const endDate = ninetyDaysFromNow.toISOString().split('T')[0];

    const data = await discoverMediaPaginated('movie', {
        page,
        sortBy: 'primary_release_date.asc',
        'primary_release_date.gte': today,
        'primary_release_date.lte': endDate,
        'with_release_type': '2|3', // Theatrical (limited + regular)
        region: 'US',
    });
    return data;
};

export const getTrending = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const cacheKey = `tmdb_trending_${mediaType}_week_v1`;
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if (cached) return cached;

    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`trending/${mediaType}/week`);
    
    setToCache(cacheKey, data.results, CACHE_TTL_SHORT);
    return data.results;
};

export const getNewlyPopularEpisodes = async (): Promise<NewlyPopularEpisode[]> => {
  const trendingShows = await getTrending('tv');
  const popularShows = await discoverMedia('tv', { sortBy: 'popularity.desc' });
  const combinedShows = [...trendingShows, ...popularShows];
  const uniqueShows = Array.from(new Map(combinedShows.map(item => [item.id, item])).values());
  
  const detailPromises = uniqueShows.slice(0, 30).map(show => getMediaDetails(show.id, 'tv').catch(() => null));
  const showDetailsList = await Promise.all(detailPromises);
  
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  
  const episodes: NewlyPopularEpisode[] = [];

  for (const details of showDetailsList) {
    if (details && details.last_episode_to_air) {
      const airDate = new Date(`${details.last_episode_to_air.air_date}T00:00:00Z`);
      if (airDate >= oneMonthAgo && airDate <= new Date()) {
        const showInfo: TrackedItem = {
          id: details.id,
          title: details.name || 'Untitled',
          media_type: 'tv',
          poster_path: details.poster_path,
          genre_ids: details.genres.map(g => g.id),
        };
        episodes.push({
          showInfo: showInfo,
          episode: details.last_episode_to_air,
        });
      }
    }
  }

  episodes.sort((a, b) => new Date(b.episode.air_date).getTime() - new Date(a.episode.air_date).getTime());
  
  return episodes.slice(0, 30);
};


export const getUpcomingMovies = async (): Promise<TmdbMedia[]> => {
    const today = new Date().toISOString().split('T')[0];
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    const endDate = twoMonthsLater.toISOString().split('T')[0];
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`discover/movie?primary_release_date.gte=${today}&primary_release_date.lte=${endDate}&sort_by=popularity.desc&region=US`);
    return data.results.map(item => ({ ...item, media_type: 'movie' }));
};

export const getPersonDetails = async (personId: number): Promise<PersonDetails> => {
    const cacheKey = `tmdb_person_${personId}`;
    const cached = getFromCache<PersonDetails>(cacheKey);
    if(cached) return cached;

    const data = await fetchFromTmdb<PersonDetails>(`person/${personId}?append_to_response=combined_credits,images`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getWatchProviders = async (id: number, mediaType: 'tv' | 'movie'): Promise<WatchProviderResponse> => {
    const cacheKey = `tmdb_providers_${mediaType}_${id}`;
    const cached = getFromCache<WatchProviderResponse>(cacheKey);
    if(cached) return cached;
    const data = await fetchFromTmdb<WatchProviderResponse>(`${mediaType}/${id}/watch/providers`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getCollectionDetails = async (collectionId: number): Promise<TmdbCollection> => {
    const cacheKey = `tmdb_collection_${collectionId}`;
    const cached = getFromCache<TmdbCollection>(cacheKey);
    if(cached) return cached;
    const data = await fetchFromTmdb<TmdbCollection>(`collection/${collectionId}`);
    // Add media_type to each part for consistency
    data.parts = data.parts.map(p => ({...p, media_type: 'movie'}));
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

// Function for calendar data (can be expanded)
export const getCalendarMedia = async (startDate: string, days: number): Promise<CalendarItem[]> => {
  // This is a complex function. For now, it will just fetch upcoming movies as an example.
  // A full implementation would involve fetching user's tracked shows and their episode air dates.
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const movies = await getUpcomingMovies(); // Simple version
  return movies.map(m => ({
    id: m.id,
    media_type: 'movie',
    poster_path: m.poster_path,
    title: m.title || '',
    date: m.release_date || '',
    episodeInfo: 'Movie Release'
  }));
};