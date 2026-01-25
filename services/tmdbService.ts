import { TMDB_API_BASE_URL, TMDB_API_KEY } from '../constants';
import { TmdbMedia, TmdbMediaDetails, TmdbSeasonDetails, WatchProviderResponse, TmdbCollection, TmdbFindResponse, PersonDetails, TrackedItem, TmdbPerson, CalendarItem, NewlyPopularEpisode, CastMember, CrewMember } from '../types';
import { getFromCache, setToCache } from '../utils/cacheUtils';

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

const CACHE_TTL = 2 * 60 * 60 * 1000;
const CACHE_TTL_SHORT = 2 * 60 * 60 * 1000;

export const clearMediaCache = (id: number, mediaType: 'tv' | 'movie'): void => {
    const cacheKey = `tmdb_details_v4_${mediaType}_${id}`;
    try {
        localStorage.removeItem(cacheKey);
    } catch (error) {}
}

export const clearSeasonCache = (tvId: number, seasonNumber: number): void => {
    const cacheKey = `tmdb_season_${tvId}_${seasonNumber}`;
    try {
        localStorage.removeItem(cacheKey);
    } catch (error) {}
};

const fetchFromTmdb = async <T,>(endpoint: string, method: 'GET' | 'POST' = 'GET', body: object | null = null, extraParams: string = ''): Promise<T | null> => {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${TMDB_API_BASE_URL}/${endpoint}${separator}api_key=${TMDB_API_KEY}${extraParams}`;
  const options: RequestInit = {
    method,
    headers: {
      'accept': 'application/json',
      'content-type': method === 'POST' ? 'application/json' : 'text/plain',
    }
  };
  
  if (method === 'POST' && body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  
  if (!response.ok) {
    if (response.status === 404) return null;
    let message = 'Failed to fetch data from TMDB';
    try {
        const errorData = await response.json();
        if (errorData && errorData.status_message) message = `TMDB Error: ${errorData.status_message}`;
    } catch(e) {}
    throw new Error(message);
  }
  
  const data = await response.json();
  if (data.success === false) return null;
  return data;
};

export const searchMedia = async (query: string): Promise<TmdbMedia[]> => {
    if (!query || !query.trim()) return [];
    const normalizedQuery = query.toLowerCase().trim();
    const searchTerm = aliasMap[normalizedQuery] || query;
    const yearRegex = /\b(19|20)\d{2}\b/;
    const yearMatch = searchTerm.match(yearRegex);

    if (yearMatch) {
        const year = yearMatch[0];
        const titleQuery = searchTerm.replace(yearRegex, '').trim();
        if (!titleQuery) return [];
        const [movieResults, tvResults] = await Promise.all([
            fetchFromTmdb<{ results: TmdbMedia[] }>(`search/movie?query=${encodeURIComponent(titleQuery)}&primary_release_year=${year}`),
            fetchFromTmdb<{ results: TmdbMedia[] }>(`search/tv?query=${encodeURIComponent(titleQuery)}&first_air_date_year=${year}`)
        ]);
        const results = [...(movieResults?.results || []).map(i => ({...i, media_type: 'movie' as const})), ...(tvResults?.results || []).map(i => ({...i, media_type: 'tv' as const}))];
        return results.sort((a,b) => (b.popularity || 0) - (a.popularity || 0));
    } else {
        const data = await fetchFromTmdb<{ results: (TmdbMedia & { media_type: 'movie' | 'tv' | 'person' })[] }>(`search/multi?query=${encodeURIComponent(searchTerm)}`);
        if (!data) return [];
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv') as TmdbMedia[];
    }
};

export const searchMediaPaginated = async (query: string, page: number = 1): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    if (!query || !query.trim()) return { results: [], total_pages: 0 };
    const normalizedQuery = query.toLowerCase().trim();
    const searchTerm = aliasMap[normalizedQuery] || query;
    const data = await fetchFromTmdb<{ results: (TmdbMedia & { media_type: 'movie' | 'tv' | 'person' })[], total_pages: number }>(`search/multi?query=${encodeURIComponent(searchTerm)}&page=${page}`);
    if (!data) return { results: [], total_pages: 0 };
    return {
        results: data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv') as TmdbMedia[],
        total_pages: data.total_pages
    };
};

export const searchPeoplePaginated = async (query: string, page: number = 1): Promise<{ results: TmdbPerson[], total_pages: number }> => {
    if (!query || !query.trim()) return { results: [], total_pages: 0 };
    const data = await fetchFromTmdb<{ results: TmdbPerson[], total_pages: number }>(`search/person?query=${encodeURIComponent(query)}&page=${page}`);
    return data || { results: [], total_pages: 0 };
};

export const findByImdbId = async (imdbId: string): Promise<TmdbFindResponse | null> => {
    if (!imdbId) throw new Error("IMDB ID required");
    const cacheKey = `tmdb_find_${imdbId}`;
    const cached = getFromCache<TmdbFindResponse>(cacheKey);
    if (cached) return cached;
    const data = await fetchFromTmdb<TmdbFindResponse>(`find/${imdbId}?external_source=imdb_id`);
    if (data) setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const findByTvdbId = async (tvdbId: number): Promise<TmdbFindResponse | null> => {
    if (!tvdbId) throw new Error("TVDB ID required");
    const cacheKey = `tmdb_find_tvdb_${tvdbId}`;
    const cached = getFromCache<TmdbFindResponse>(cacheKey);
    if (cached) return cached;
    const data = await fetchFromTmdb<TmdbFindResponse>(`find/${tvdbId}?external_source=tvdb_id`);
    if (data) setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getMediaDetails = async (id: number, mediaType: 'tv' | 'movie'): Promise<TmdbMediaDetails> => {
  if (!id || isNaN(id)) throw new Error("Valid ID required");
  if (mediaType !== 'tv' && mediaType !== 'movie') {
    console.error(`getMediaDetails called with invalid mediaType: ${mediaType}`);
    throw new Error("The resource you requested could not be found.");
  }
  
  const cacheKey = `tmdb_details_v4_${mediaType}_${id}`;
  const cached = getFromCache<TmdbMediaDetails>(cacheKey);
  if (cached) return cached;
  
  const imageLangParam = "include_image_language=en,null";
  const commonAppend = "images,recommendations,credits,videos,external_ids,watch/providers";
  
  if (mediaType === 'tv') {
    const [detailsData, ratingsData] = await Promise.all([
        fetchFromTmdb<TmdbMediaDetails>(`${mediaType}/${id}?append_to_response=${commonAppend}&${imageLangParam}`),
        fetchFromTmdb<{ results: any[] }>(`tv/${id}/content_ratings`).catch(() => ({ results: [] }))
    ]);
    if (!detailsData) throw new Error("The resource you requested could not be found.");
    detailsData.media_type = 'tv';
    detailsData.content_ratings = ratingsData || { results: [] };
    setToCache(cacheKey, detailsData, CACHE_TTL);
    return detailsData;
  } else {
    const data = await fetchFromTmdb<TmdbMediaDetails>(`${mediaType}/${id}?append_to_response=${commonAppend},release_dates&${imageLangParam}`);
    if (!data) throw new Error("The resource you requested could not be found.");
    data.media_type = 'movie';
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
  }
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number): Promise<TmdbSeasonDetails> => {
  if (!tvId || isNaN(tvId)) throw new Error("Valid Show ID required");
  const cacheKey = `tmdb_season_${tvId}_${seasonNumber}`;
  const cached = getFromCache<TmdbSeasonDetails>(cacheKey);
  if (cached) return cached;
  const data = await fetchFromTmdb<TmdbSeasonDetails>(`tv/${tvId}/season/${seasonNumber}?append_to_response=aggregate_credits&include_image_language=en,null`);
  if (!data) throw new Error("Season not found.");
  data.episodes = (data.episodes || []).map(e => ({ ...e, season_number: seasonNumber }));
  setToCache(cacheKey, data, CACHE_TTL);
  return data;
};

export const getEpisodeCredits = async (tvId: number, seasonNumber: number, episodeNumber: number): Promise<any> => {
    return await fetchFromTmdb<any>(`tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/credits`);
}

/**
 * Aggregates show credits from multiple seasons.
 * Optimized to prune redundant data before caching to stay within LocalStorage limits.
 */
export const getShowAggregateCredits = async (tvId: number, seasons: TmdbMediaDetails['seasons']): Promise<{ mainCast: CastMember[], guestStars: CastMember[], crew: CrewMember[] }> => {
    const cacheKey = `tmdb_agg_credits_v3_${tvId}`;
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;
    if (!seasons) return { mainCast: [], guestStars: [], crew: [] };

    // Limit scanning to stay within memory limits for massive shows (like Law & Order)
    const episodeCreditPromises: (() => Promise<any | null>)[] = [];
    const seasonsToFetch = seasons.filter(s => s.season_number > 0).sort((a, b) => b.season_number - a.season_number);
    
    // Safety: Only check up to 10 most recent seasons for credits to identify current cast
    const SEASON_LIMIT = 10;
    const seasonsSlice = seasonsToFetch.slice(0, SEASON_LIMIT);

    for (const season of seasonsSlice) {
        // Sample only 3 episodes per season (start, mid, end) for large shows to capture cast shifts
        const epIndices = season.episode_count <= 3 
            ? Array.from({length: season.episode_count}, (_, i) => i + 1)
            : [1, Math.floor(season.episode_count / 2), season.episode_count];

        epIndices.forEach(epNum => {
            episodeCreditPromises.push(() => getEpisodeCredits(tvId, season.season_number, epNum).catch(() => null));
        });
    }

    const allEpisodeCredits: (any | null)[] = [];
    const batchSize = 10;
    for (let i = 0; i < episodeCreditPromises.length; i += batchSize) {
        const batch = episodeCreditPromises.slice(i, i + batchSize).map(p => p());
        const results = await Promise.all(batch);
        allEpisodeCredits.push(...results);
        if (episodeCreditPromises.length > batchSize) await new Promise(r => setTimeout(r, 200));
    }

    const mainCastMap = new Map<number, { person: CastMember, appearances: number }>();
    const crewMap = new Map<number, { person: CrewMember, appearances: number }>();

    for (const credits of allEpisodeCredits) {
        if (!credits) continue;
        credits.cast?.forEach((person: any) => {
            if (!mainCastMap.has(person.id)) {
                // Lean Person Object
                mainCastMap.set(person.id, { 
                    person: { id: person.id, name: person.name, profile_path: person.profile_path, character: person.character, order: person.order }, 
                    appearances: 0 
                });
            }
            mainCastMap.get(person.id)!.appearances++;
        });
        credits.crew?.forEach((person: any) => {
            if (!crewMap.has(person.id)) {
                crewMap.set(person.id, { 
                    person: { id: person.id, name: person.name, profile_path: person.profile_path, job: person.job, department: person.department }, 
                    appearances: 0 
                });
            }
            crewMap.get(person.id)!.appearances++;
        });
    }

    // STRICT PRUNING: Only keep top 25 cast and 15 crew members to ensure cache stability
    const mainCast = Array.from(mainCastMap.values())
        .sort((a,b) => b.appearances - a.appearances)
        .slice(0, 25)
        .map(entry => entry.person);

    const crew = Array.from(crewMap.values())
        .sort((a, b) => b.appearances - a.appearances)
        .slice(0, 15)
        .map(entry => entry.person);

    const result = { mainCast, guestStars: [], crew };
    setToCache(cacheKey, result, CACHE_TTL * 12);
    return result;
};

export const getGenres = async (): Promise<Record<number, string>> => {
  const cacheKey = 'tmdb_genres_v2';
  const cached = getFromCache<Record<number, string>>(cacheKey);
  if (cached) return cached;
  const [tvGenres, movieGenres] = await Promise.all([
    fetchFromTmdb<{ genres: { id: number, name: string }[] }>('genre/tv/list'),
    fetchFromTmdb<{ genres: { id: number, name: string }[] }>('genre/movie/list')
  ]);
  const allGenres: Record<number, string> = {};
  tvGenres?.genres.forEach(g => allGenres[g.id] = g.name);
  movieGenres?.genres.forEach(g => allGenres[g.id] = g.name);
  setToCache(cacheKey, allGenres, CACHE_TTL * 12);
  return allGenres;
};

export const discoverMedia = async (mediaType: 'tv' | 'movie', filters: any): Promise<TmdbMedia[]> => {
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
    if (filters.watch_region) params += `&watch_region=${filters.watch_region}`;
    if (filters.with_watch_monetization_types) params += `&with_watch_monetization_types=${filters.with_watch_monetization_types}`;
    const cacheKey = `tmdb_discover_${mediaType}_v2_${params}`;
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if(cached) return cached;
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`discover/${mediaType}?include_adult=false&language=en-US${params}`);
    const results = (data?.results || []).map(item => ({ ...item, media_type: mediaType }));
    setToCache(cacheKey, results, CACHE_TTL_SHORT);
    return results;
};

export const discoverMediaPaginated = async (mediaType: 'tv' | 'movie', filters: any): Promise<{ results: TmdbMedia[], total_pages: number }> => {
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
    if (filters.watch_region) params += `&watch_region=${filters.watch_region}`;
    if (filters.with_watch_monetization_types) params += `&with_watch_monetization_types=${filters.with_watch_monetization_types}`;
    
    const data = await fetchFromTmdb<{ results: TmdbMedia[], total_pages: number }>(`discover/${mediaType}?include_adult=false&language=en-US${params}`);
    if (!data) return { results: [], total_pages: 0 };
    return {
        results: data.results.map(item => ({ ...item, media_type: mediaType })),
        total_pages: data.total_pages
    };
};

export const getTrending = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const cacheKey = `tmdb_trending_${mediaType}/week_v1`;
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if (cached) return cached;
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`trending/${mediaType}/week`);
    const results = (data?.results || []).map(item => ({ ...item, media_type: mediaType }));
    setToCache(cacheKey, results, CACHE_TTL_SHORT);
    return results;
};

export const getTopPicksMixed = async (): Promise<TmdbMedia[]> => {
    const cacheKey = 'tmdb_top_picks_30_v3';
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if (cached) return cached;

    try {
        const [trendingMovies, trendingTv] = await Promise.all([
            getTrending('movie'),
            getTrending('tv')
        ]);

        const combined = [...trendingMovies, ...trendingTv];
        const unique = Array.from(new Map(combined.map(i => [i.id, i])).values());
        
        const shuffled = unique.sort(() => Math.random() - 0.5);
        const result = shuffled.slice(0, 30);
        
        setToCache(cacheKey, result, CACHE_TTL_SHORT);
        return result;
    } catch (e) {
        return [];
    }
};

export const getNewlyPopularEpisodes = async (): Promise<NewlyPopularEpisode[]> => {
  const trendingShows = await getTrending('tv');
  const popularShows = await discoverMedia('tv', { sortBy: 'popularity.desc' });
  const uniqueShows = Array.from(new Map([...trendingShows, ...popularShows].map(item => [item.id, item])).values());
  const showsToFetch = uniqueShows.slice(0, 30);
  const showDetailsList: (TmdbMediaDetails | null)[] = [];
  for (let i = 0; i < showsToFetch.length; i += 10) {
      const batch = showsToFetch.slice(i, i + 10);
      showDetailsList.push(...await Promise.all(batch.map(s => getMediaDetails(s.id, 'tv').catch(() => null))));
      if (i + 10 < showsToFetch.length) await new Promise(r => setTimeout(r, 400));
  }
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const episodes: NewlyPopularEpisode[] = [];
  for (const details of showDetailsList) {
    if (details?.last_episode_to_air) {
      const airDate = new Date(`${details.last_episode_to_air.air_date}T00:00:00Z`);
      if (airDate >= oneMonthAgo && airDate <= new Date()) {
        episodes.push({ showInfo: { id: details.id, title: details.name || 'Untitled', media_type: 'tv', poster_path: details.poster_path, genre_ids: details.genres.map(g => g.id) }, episode: details.last_episode_to_air });
      }
    }
  }
  episodes.sort((a,b) => new Date(b.episode.air_date).getTime() - new Date(a.episode.air_date).getTime());
  return episodes.slice(0, 30);
};

export const getUpcomingMovies = async (): Promise<TmdbMedia[]> => {
    const today = new Date().toISOString().split('T')[0];
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    const endDate = twoMonthsLater.toISOString().split('T')[0];
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`discover/movie?primary_release_date.gte=${today}&primary_release_date.lte=${endDate}&sort_by=popularity.desc&region=US`);
    return (data?.results || []).map(i => ({ ...i, media_type: 'movie' }));
};

/**
 * Fetches upcoming movie releases with pagination.
 */
export const getUpcomingMovieReleases = async (page: number = 1): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const today = new Date().toISOString().split('T')[0];
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    const endDate = twoMonthsLater.toISOString().split('T')[0];
    
    const data = await fetchFromTmdb<{ results: TmdbMedia[], total_pages: number }>(
        `discover/movie?primary_release_date.gte=${today}&primary_release_date.lte=${endDate}&sort_by=popularity.desc&region=US&page=${page}`
    );
    
    if (!data) return { results: [], total_pages: 0 };
    return {
        results: data.results.map(i => ({ ...i, media_type: 'movie' })),
        total_pages: data.total_pages
    };
};

/**
 * Fetches recent popular releases for both movies and TV.
 */
export const getNewReleases = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
    
    if (mediaType === 'movie') {
        return discoverMedia('movie', {
            'primary_release_date.gte': oneMonthAgoStr,
            'primary_release_date.lte': todayStr,
            'sortBy': 'popularity.desc'
        });
    } else {
        return discoverMedia('tv', {
            'first_air_date.gte': oneMonthAgoStr,
            'first_air_date.lte': todayStr,
            'sortBy': 'popularity.desc'
        });
    }
};

/**
 * Fetches popular new releases with pagination.
 */
export const getAllNewReleasesPaginated = async (page: number = 1): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

    const data = await fetchFromTmdb<{ results: TmdbMedia[], total_pages: number }>(
        `discover/movie?primary_release_date.gte=${oneMonthAgoStr}&primary_release_date.lte=${todayStr}&sort_by=popularity.desc&page=${page}`
    );
    
    if (!data) return { results: [], total_pages: 0 };
    return {
        results: data.results.map(i => ({ ...i, media_type: 'movie' })),
        total_pages: data.total_pages
    };
};

/**
 * Fetches shows that have aired new seasons/premieres recently.
 */
export const getNewSeasons = async (forceRefresh: boolean = false, timezone: string = 'UTC'): Promise<TmdbMediaDetails[]> => {
    const trendingShows = await getTrending('tv');
    const showDetailsPromises = trendingShows.slice(0, 20).map(s => getMediaDetails(s.id, 'tv').catch(() => null));
    const results = await Promise.all(showDetailsPromises);
    return results.filter((d): d is TmdbMediaDetails => d !== null);
};

export const getPersonDetails = async (personId: number): Promise<PersonDetails> => {
    if (!personId || isNaN(personId)) throw new Error("Valid Person ID required");
    const cacheKey = `tmdb_person_${personId}`;
    const cached = getFromCache<PersonDetails>(cacheKey);
    if (cached) return cached;
    const data = await fetchFromTmdb<PersonDetails>(`person/${personId}?append_to_response=combined_credits,images`);
    if (!data) throw new Error("Person not found.");
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getWatchProviders = async (id: number, mediaType: 'tv' | 'movie'): Promise<WatchProviderResponse | null> => {
    if (!id || isNaN(id)) throw new Error("Valid ID required");
    if (mediaType !== 'tv' && mediaType !== 'movie') {
        console.warn(`getWatchProviders called with invalid mediaType: ${mediaType}`);
        return null;
    }
    const cacheKey = `tmdb_providers_${mediaType}_${id}`;
    const cached = getFromCache<WatchProviderResponse>(cacheKey);
    if (cached) return cached;
    const data = await fetchFromTmdb<WatchProviderResponse>(`${mediaType}/${id}/watch/providers`);
    if (data) setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getWatchProvidersForShow = async (id: number): Promise<WatchProviderResponse | null> => {
    return getWatchProviders(id, 'tv');
};

export const getCollectionDetails = async (collectionId: number): Promise<TmdbCollection> => {
    if (!collectionId || isNaN(collectionId)) throw new Error("Valid ID required");
    const cacheKey = `tmdb_collection_${collectionId}`;
    const cached = getFromCache<TmdbCollection>(cacheKey);
    if (cached) return cached;
    const data = await fetchFromTmdb<TmdbCollection>(`collection/${collectionId}`);
    if (!data) throw new Error("Collection not found.");
    data.parts = (data.parts || []).map(p => ({...p, media_type: 'movie'}));
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getCalendarMedia = async (startDate: string, days: number): Promise<CalendarItem[]> => {
  const movies = await getUpcomingMovies();
  return movies.map(m => ({ id: m.id, media_type: 'movie', poster_path: m.poster_path, title: m.title || '', date: m.release_date || '', episodeInfo: 'Movie Release' }));
};
