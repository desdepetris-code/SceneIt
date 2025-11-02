import React, { useEffect, useState, useMemo } from 'react';
import { getImageUrl } from '../utils/imageUtils';

const genreEmojis: Record<string, string> = {
  'Comedy': '🤣', 'Drama': '😶‍🌫️', 'Romance': '💘', 'Action': '💥', 'Adventure': '🏞️',
  'Fantasy': '🐉', 'Sci-Fi': '👽', 'Science Fiction': '👽', 'Thriller': '🕵️‍♀️', 'Mystery': '🕵️‍♀️',
  'Crime': '🧤', 'Documentary': '🎥', 'Reality': '📸', 'Lifestyle': '📸',
  'Medical': '🩺', 'Superhero': '🦸‍♂️', 'Musical': '🎶', 'Music': '🎶',
  'Historical': '📜', 'History': '📜', 'War': '🪖', 'Military': '🪖', 'Western': '🐎',
  'Animation': '🪷', 'Family': '🧸', 'Kids': '🧸', 'Horror': '🔪', 'Sports': '🏁'
};

const genreColors: Record<string, string> = {
    'Romance': '#ec4899', 'Superhero': '#f59e0b', 'Action': '#ef4444', 
    'Adventure': '#84cc16', 'Comedy': '#eab308', 'Drama': '#60a5fa', 
    'Fantasy': '#a855f7', 'Sci-Fi': '#22d3ee', 'Science Fiction': '#22d3ee', 
    'Horror': '#7f1d1d', 'Thriller': '#374151', 'Mystery': '#374151',
    'Crime': '#4b5563', 'Animation': '#f472b6', 'Family': '#34d399',
    'War': '#78350f', 'Western': '#92400e', 'History': '#a16207',
};

interface Particle {
  id: number;
  type: 'heart' | 'poster' | 'emoji';
  style: React.CSSProperties;
  content: string;
}

interface FavoriteAnimationProps {
  onAnimationEnd: () => void;
  genreId: number | undefined;
  posterPath: string | null;
  genresMap: Record<number, string>;
  direction: 'up' | 'down';
}

const FavoriteAnimation: React.FC<FavoriteAnimationProps> = ({ onAnimationEnd, genreId, posterPath, genresMap, direction }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const genreName = useMemo(() => {
    if (!genreId) return null;
    return genresMap[genreId] || null;
  }, [genreId, genresMap]);
  
  const { genreEmoji, genreColor } = useMemo(() => {
      let emoji = '💖';
      let color = 'var(--color-accent-primary)';
      if (genreName) {
          const matchingEmojiKey = Object.keys(genreEmojis).find(key => genreName.includes(key));
          if (matchingEmojiKey) emoji = genreEmojis[matchingEmojiKey];
          
          const matchingColorKey = Object.keys(genreColors).find(key => genreName.includes(key));
          if (matchingColorKey) color = genreColors[matchingColorKey];
      }
      return { genreEmoji: emoji, genreColor: color };
  }, [genreName]);


  useEffect(() => {
    const newParticles: Particle[] = [];
    const numParticles = 50; // Increased for more impact
    
    for (let i = 0; i < numParticles; i++) {
        const typeRoll = Math.random();
        let type: Particle['type'];
        let content: string;
        
        if (typeRoll < 0.3) { // 30% hearts
            type = 'heart';
            content = '❤️';
        } else if (typeRoll < 0.8 && posterPath) { // 50% posters
            type = 'poster';
            content = getImageUrl(posterPath, 'w92');
        } else { // 20% emojis
            type = 'emoji';
            content = genreEmoji;
        }

        newParticles.push({
            id: i,
            type,
            content,
            // FIX: Cast style object to React.CSSProperties to allow for custom CSS properties like '--i'.
            style: {
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 2 + 2.5}s`, // Slower, longer animation
                animationDelay: `${Math.random() * 1.5}s`,
                fontSize: `${Math.random() * 2 + 1.5}rem`, // Bigger emojis/hearts
                '--i': i,
                ...(direction === 'up' 
                  ? { bottom: `-${Math.random() * 20}%` }
                  : { top: `-${Math.random() * 20}%` }
                )
            } as React.CSSProperties,
        });
    }

    setParticles(newParticles);

    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 4500); // Animation duration (2.5-4.5s) + max delay (1.5s)

    return () => clearTimeout(timer);
  }, [genreEmoji, posterPath, onAnimationEnd, direction]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((p) => {
            const particleClassName = `particle ${direction === 'down' ? 'down' : ''}`;
            if (p.type === 'poster') {
                return (
                    <div
                        key={p.id}
                        className={particleClassName}
                        style={{
                            ...p.style,
                            width: '2.5rem',
                            height: '3.75rem',
                            backgroundImage: `url(${p.content})`,
                            backgroundSize: 'cover',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            filter: `drop-shadow(0 0 5px ${genreColor})`
                        }}
                    ></div>
                );
            }
            return (
                <span
                    key={p.id}
                    className={particleClassName}
                    style={{
                        ...p.style,
                        textShadow: `0 0 8px ${genreColor}`
                    }}
                >
                    {p.content}
                </span>
            );
        })}
    </div>
  );
};

export default FavoriteAnimation;
