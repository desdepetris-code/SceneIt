import { GoogleGenAI, Type } from "@google/genai";
import { UserData, TrackedItem, TmdbMedia } from '../types';
import { searchMedia, discoverMedia } from './tmdbService';

// FIX: Implement AI recommendation service using Gemini API.

let ai: GoogleGenAI | null = null;
// Gemini API features are temporarily disabled.
// To re-enable, uncomment the block below.
// Gracefully handle the case where process.env is not available (e.g., in a browser)
try {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY && process.env.API_KEY !== 'YOUR_API_KEY_HERE') {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  } else {
    console.warn("Gemini API key not found or is a placeholder. AI features will be disabled.");
  }
} catch (e) {
    console.error("Could not initialize GoogleGenAI. AI features will be disabled.", e);
}



interface RecommendedTitle {
    title: string;
    year: number;
    reason: string;
}

// --- Request Queue for Rate Limiting ---
type AIRequest<T> = {
  requestFn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
};

const requestQueue: AIRequest<any>[] = [];
let isProcessing = false;
// Add a delay of 1.1 seconds between requests to stay under the 60 RPM limit.
const REQUEST_DELAY = 1100;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }
  isProcessing = true;
  const { requestFn, resolve, reject } = requestQueue.shift()!;
  
  try {
    const result = await requestFn();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, REQUEST_DELAY);
  }
}

function addToQueue<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push({ requestFn, resolve, reject });
    if (!isProcessing) {
      processQueue();
    }
  });
}
// --- End Request Queue ---


export const getAIReasonsForMedia = async (mediaList: TmdbMedia[]): Promise<Record<number, string>> => {
    const requestFn = async (): Promise<Record<number, string>> => {
        if (!ai) {
            // console.warn("AI features are disabled. Cannot get reasons for media.");
            return {};
        }
        if (mediaList.length === 0) return {};

        const titlesWithIds = mediaList.map(item => ({
            id: item.id,
            title: `${item.title || item.name} (${item.release_date?.substring(0,4) || item.first_air_date?.substring(0,4) || 'N/A'})`
        }));

        const prompt = `For each movie/show in the following JSON array, provide a very short, catchy, one-sentence tagline (under 8 words) why someone should watch it. The tagline MUST NOT contain the movie or show's title.

        Input:
        ${JSON.stringify(titlesWithIds, null, 2)}

        Return a single JSON object where keys are the movie/show IDs (as strings) and values are the taglines. Example: { "123": "A thrilling heist with a shocking twist.", "456": "Heartwarming comedy that will make you cry." }`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            const jsonText = response.text.trim();
            const result = JSON.parse(jsonText);
            
            if (typeof result !== 'object' || result === null || Array.isArray(result)) {
                throw new Error("AI returned an invalid format.");
            }
            
            return result;
        } catch (e) {
            console.error("Error getting AI reasons:", e);
            // Don't rethrow, just return an empty object to prevent a single failure
            // from breaking all subsequent carousel reason lookups.
            return {}; 
        }
    };

    return addToQueue(requestFn);
};

// Helper for generic, non-AI recommendations
const getGenericRecommendations = async (): Promise<{ recommendation: RecommendedTitle, media: TmdbMedia }[]> => {
    try {
        const [popularMovies, popularTv] = await Promise.all([
            discoverMedia('movie', { sortBy: 'popularity.desc', vote_count_gte: 500 }),
            discoverMedia('tv', { sortBy: 'popularity.desc', vote_count_gte: 250 })
        ]);

        const genericRecs: { recommendation: RecommendedTitle, media: TmdbMedia }[] = [];
        for (let i = 0; i < 5; i++) {
            if (popularMovies[i]) {
                genericRecs.push({
                    recommendation: { title: popularMovies[i].title || popularMovies[i].name || '', year: popularMovies[i].release_date ? parseInt(popularMovies[i].release_date.substring(0, 4)) : 0, reason: 'Popular Movie' },
                    media: popularMovies[i]
                });
            }
            if (popularTv[i]) {
                genericRecs.push({
                    recommendation: { title: popularTv[i].title || popularTv[i].name || '', year: popularTv[i].first_air_date ? parseInt(popularTv[i].first_air_date.substring(0, 4)) : 0, reason: 'Popular TV Show' },
                    media: popularTv[i]
                });
            }
        }
        return genericRecs.sort((a, b) => (b.media.popularity || 0) - (a.media.popularity || 0)).slice(0, 5);
    } catch (e) {
        console.error("Error fetching generic recommendations:", e);
        // Return empty array on failure instead of throwing
        return [];
    }
};

export const getAIRecommendations = async (userData: UserData): Promise<{ recommendation: RecommendedTitle, media: TmdbMedia }[]> => {
    const favoriteItems = userData.favorites;
    const highlyRatedItems = Object.entries(userData.ratings)
        .filter(([, ratingInfo]) => ratingInfo.rating >= 4)
        .map(([id]) => {
            const allItems = [...userData.watching, ...userData.planToWatch, ...userData.completed, ...userData.favorites, ...userData.onHold, ...userData.dropped];
            return allItems.find(item => item.id === Number(id));
        })
        .filter((item): item is TrackedItem => !!item);
    
    const seedItems = [...favoriteItems, ...highlyRatedItems];
    const uniqueSeedItems = Array.from(new Map(seedItems.map(item => [item.id, item])).values());
    
    if (uniqueSeedItems.length === 0 || !ai) {
        if (!ai) {
            console.warn("AI features are disabled. Falling back to generic recommendations.");
        }
        return getGenericRecommendations();
    }

    // The AI part is queued
    const requestFn = async (): Promise<{ recommendation: RecommendedTitle, media: TmdbMedia }[]> => {
        // AI is guaranteed to be non-null here due to the check above
        const titles = uniqueSeedItems.slice(0, 10).map(item => item.title).join(', ');
        const allUserMediaIds = new Set(uniqueSeedItems.map(i => i.id));

        const prompt = `Based on a user's interest in the following movies and TV shows, recommend 15 new movies or TV shows they might like. The user likes: ${titles}. For each recommendation, provide a brief, one-sentence reason why they would like it. Do not recommend titles from the input list.`;

        try {
            const response = await ai!.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "The title of the recommended movie or show." },
                                year: { type: Type.INTEGER, description: "The release year of the recommendation." },
                                reason: { type: Type.STRING, description: "A brief, one-sentence reason for the recommendation." },
                            },
                            required: ["title", "year", "reason"],
                        }
                    }
                }
            });

            const jsonText = response.text.trim();
            const recommendations: RecommendedTitle[] = JSON.parse(jsonText);

            if (!recommendations || recommendations.length === 0) return [];
            
            const searchPromises = recommendations.map(rec => searchMedia(`${rec.title} ${rec.year}`));
            const searchResults = await Promise.all(searchPromises);

            const finalRecommendations: { recommendation: RecommendedTitle, media: TmdbMedia }[] = [];
            searchResults.forEach((results, index) => {
                const bestMatch = results.find(r => !allUserMediaIds.has(r.id));
                if (bestMatch) {
                    finalRecommendations.push({
                        recommendation: recommendations[index],
                        media: bestMatch,
                    });
                }
            });

            return finalRecommendations;
        } catch (e) {
            console.error("Error getting AI recommendations:", e);
            // Fallback to generic recommendations on AI error
            return getGenericRecommendations();
        }
    };

    return addToQueue(requestFn);
};