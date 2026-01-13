
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { TmdbMediaDetails, UserData } from '../types';
import { SparklesIcon, CheckCircleIcon, XMarkIcon, FireIcon } from './Icons';

interface AIPredictionTabProps {
  details: TmdbMediaDetails;
  userData: UserData;
  genres: Record<number, string>;
}

interface PredictionResult {
  matchPercentage: number;
  pros: string[];
  cons: string[];
  verdict: string;
}

const AIPredictionTab: React.FC<AIPredictionTabProps> = ({ details, userData, genres }) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userSummary = useMemo(() => {
    const favoriteTitles = userData.favorites.map(f => f.title).slice(0, 10).join(', ');
    const topGenres = Object.entries(userData.ratings)
      // FIX: Explicitly cast 'r' to the rating object structure to resolve TypeScript 'unknown' property access error.
      .filter(([_, r]) => (r as { rating: number }).rating >= 4)
      .map(([id]) => id) // This is a bit simplified, ideally we'd map to actual genres
      .slice(0, 5)
      .join(', ');
    
    return { favoriteTitles, topGenres };
  }, [userData]);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Compare this user's taste with the show/movie "${details.title || details.name}".
        
        User Favorites: ${userSummary.favoriteTitles || 'None yet'}
        Current Item Genres: ${details.genres?.map(g => g.name).join(', ')}
        Current Item Overview: ${details.overview}
        Current Item Cast: ${details.credits?.cast.slice(0, 5).map(c => c.name).join(', ')}

        Analyze the likelihood of this user enjoying this title. 
        Return a match percentage (0-100), a list of 3-4 pros (why they would like it), 2-3 cons (potential dislikes), and a 2-sentence verdict.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchPercentage: { type: Type.NUMBER },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              verdict: { type: Type.STRING }
            },
            required: ["matchPercentage", "pros", "cons", "verdict"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setPrediction(data);
    } catch (err) {
      console.error("AI Prediction error:", err);
      setError("Failed to generate insights. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [details.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <SparklesIcon className="w-12 h-12 text-primary-accent mb-4 animate-bounce" />
        <p className="text-text-secondary font-bold uppercase tracking-widest text-sm">Consulting the Oracle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-500/10 rounded-xl border border-red-500/20">
        <p className="text-red-400 font-semibold">{error}</p>
        <button onClick={fetchPrediction} className="mt-4 text-sm text-primary-accent hover:underline">Retry Prediction</button>
      </div>
    );
  }

  if (!prediction) return null;

  const scoreColor = prediction.matchPercentage >= 80 ? 'text-green-400' : prediction.matchPercentage >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="animate-fade-in space-y-8">
      <section className="bg-card-gradient p-8 rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center text-center">
        <div className="relative mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle 
                    cx="64" 
                    cy="64" 
                    r="58" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={364.4} 
                    strokeDashoffset={364.4 - (prediction.matchPercentage / 100) * 364.4}
                    className={`${scoreColor} transition-all duration-1000 ease-out`}
                />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-3xl font-black ${scoreColor}`}>
                {prediction.matchPercentage}%
            </div>
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Personal Match Score</h3>
        <p className="text-text-secondary max-w-md italic">"{prediction.verdict}"</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-secondary/30 p-6 rounded-2xl border border-green-500/10">
          <h4 className="flex items-center gap-2 text-green-400 font-black uppercase tracking-widest text-sm mb-4">
            <CheckCircleIcon className="w-5 h-5" /> Reasons to watch
          </h4>
          <ul className="space-y-3">
            {prediction.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
                <span className="text-green-500 mt-1">•</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-bg-secondary/30 p-6 rounded-2xl border border-red-500/10">
          <h4 className="flex items-center gap-2 text-red-400 font-black uppercase tracking-widest text-sm mb-4">
            <XMarkIcon className="w-5 h-5" /> Potential Hesitations
          </h4>
          <ul className="space-y-3">
            {prediction.cons.map((con, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
                <span className="text-red-500 mt-1">•</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-4 bg-primary-accent/5 rounded-xl border border-primary-accent/10 flex items-start gap-4">
        <FireIcon className="w-6 h-6 text-primary-accent flex-shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed">
          This prediction is powered by Gemini AI and is based on your watch history, favorites, and ratings. 
          The more you track, the more accurate your match scores become!
        </p>
      </div>
    </div>
  );
};

export default AIPredictionTab;
