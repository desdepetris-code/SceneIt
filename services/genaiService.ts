// services/genaiService.ts

// AI functionality has been disabled as per user request by removing API key dependencies.
import { UserData, TmdbMedia, TrackedItem } from '../types';
import { searchMedia, discoverMedia } from './tmdbService';

interface RecommendedTitle {
    title: string;
    year: number;
    reason: string;
}

/**
 * AI-powered reasons for media are disabled. This function now returns an empty object.
 */
export const getAIReasonsForMedia = async (mediaList: TmdbMedia[]): Promise<Record<number, string>> => {
    // Return a resolved promise with an empty object to prevent any delays or errors.
    return Promise.resolve({});
};

// Helper for generic, non-AI recommendations, which now serves as the primary recommendation source.
const getGenericRecommendations = async (): Promise<{ recommendation: RecommendedTitle, media: TmdbMedia }[]> => {
    try {
        const [
            popularMoviesP1,
            popularMoviesP2,
            popularMoviesP3,
            popularTvP1,
            popularTvP2,
            popularTvP3,
        ] = await Promise.all([
            discoverMedia('movie', { sortBy: 'popularity.desc', vote_count_gte: 500, page: 1 }),
            discoverMedia('movie', { sortBy: 'popularity.desc', vote_count_gte: 500, page: 2 }),
            discoverMedia('movie', { sortBy: 'popularity.desc', vote_count_gte: 500, page: 3 }),
            discoverMedia('tv', { sortBy: 'popularity.desc', vote_count_gte: 250, page: 1 }),
            discoverMedia('tv', { sortBy: 'popularity.desc', vote_count_gte: 250, page: 2 }),
            discoverMedia('tv', { sortBy: 'popularity.desc', vote_count_gte: 250, page: 3 }),
        ]);

        const popularMovies = [...popularMoviesP1, ...popularMoviesP2, ...popularMoviesP3];
        const popularTv = [...popularTvP1, ...popularTvP2, ...popularTvP3];

        const combined = [...popularMovies, ...popularTv].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        const uniqueMedia = Array.from(new Map(combined.map(item => [item.id, item])).values());

        const genericRecs = uniqueMedia.slice(0, 50).map(media => ({
            recommendation: {
                title: media.title || media.name || '',
                year: media.release_date ? parseInt(media.release_date.substring(0, 4)) : (media.first_air_date ? parseInt(media.first_air_date.substring(0, 4)) : 0),
                reason: media.media_type === 'movie' ? 'Popular Movie' : 'Popular TV Show'
            },
            media: media
        }));

        return genericRecs;

    } catch (e) {
        console.error("Error fetching generic recommendations:", e);
        return [];
    }
};


/**
 * AI recommendations are disabled. This function now falls back to generic popular recommendations.
 */
export const getAIRecommendations = async (userData: UserData): Promise<{ recommendation: RecommendedTitle, media: TmdbMedia }[]> => {
    console.warn("AI features are disabled. Falling back to generic recommendations.");
    return getGenericRecommendations();
};