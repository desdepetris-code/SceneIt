// services/tvmazeService.ts
import { getFromCache, setToCache } from '../utils/cacheUtils';
import { TvMazeScheduleItem } from '../types';

const TVMAZE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const TVMAZE_API_BASE_URL = 'https://api.tvmaze.com';

const fetchFromTvMaze = async <T>(endpoint: string): Promise<T> => {
  const url = `${TVMAZE_API_BASE_URL}/${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from TVMaze: ${response.statusText}`);
  }
  return response.json();
};

export const getScheduleByDate = async (country: string, date: string): Promise<TvMazeScheduleItem[]> => {
  const cacheKey = `tvmaze_schedule_${country}_${date}`;
  const cached = getFromCache<TvMazeScheduleItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchFromTvMaze<TvMazeScheduleItem[]>(`schedule?country=${country}&date=${date}`);
    setToCache(cacheKey, data, TVMAZE_CACHE_TTL);
    return data;
  } catch (error) {
    console.error(`Failed to fetch TVMaze schedule for ${date}:`, error);
    return []; // Return empty array on failure to not break the calendar
  }
};