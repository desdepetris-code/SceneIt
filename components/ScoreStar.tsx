import React from 'react';

interface ScoreStarProps {
  score: number; // A score from 0 to 10
  voteCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const getScoreStyle = (percentage: number): { strokeColor: string; solidColor: string; } => {
    if (percentage <= 10) return { strokeColor: '#6F1F2B', solidColor: '#6F1F2B' };
    if (percentage <= 20) return { strokeColor: '#800000', solidColor: '#800000' };
    if (percentage <= 30) return { strokeColor: '#5C0000', solidColor: '#5C0000' };
    if (percentage <= 40) return { strokeColor: '#800020', solidColor: '#800020' };
    if (percentage <= 50) return { strokeColor: 'url(#gold-gradient)', solidColor: '#FFD700' };
    if (percentage <= 60) return { strokeColor: 'url(#silver-gradient)', solidColor: '#C0C0C0' };
    if (percentage <= 70) return { strokeColor: '#A3B1C6', solidColor: '#A3B1C6' };
    if (percentage <= 80) return { strokeColor: '#4DD0C6', solidColor: '#4DD0C6' };
    if (percentage <= 90) return { strokeColor: '#00BFA5', solidColor: '#00BFA5' };
    return { strokeColor: '#1A237E', solidColor: '#1A237E' };
};

const ScoreStar: React.FC<ScoreStarProps> = ({ score, voteCount, size = 'md', className = '' }) => {
  if (!score || score <= 0) return null;
  const percentage = Math.round(score * 10);

  const sizeConfig = {
    xs: { container: 'w-8 h-8', text: 'text-xs', stroke: 3, radius: 15 },
    sm: { container: 'w-10 h-10', text: 'text-sm', stroke: 3, radius: 15 },
    md: { container: 'w-16 h-16', text: 'text-xl', stroke: 2.5, radius: 15 },
    lg: { container: 'w-20 h-20', text: 'text-2xl', stroke: 2, radius: 15 },
  };

  const { container, text, stroke, radius } = sizeConfig[size];
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (percentage / 100) * circumference;

  const { strokeColor, solidColor } = getScoreStyle(percentage);
  
  const title = `User score: ${percentage}%` + (voteCount ? ` based on ${voteCount} votes` : '');
  
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${container} ${className}`} title={title}>
      {/* Background circle */}
      <div className="absolute inset-0 bg-bg-secondary rounded-full opacity-50"></div>

      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B8860B" />
                <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
            <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D3D3D3" />
                <stop offset="100%" stopColor="#C0C0C0" />
            </linearGradient>
        </defs>
          {/* Track */}
          <circle
            className="text-bg-secondary"
            cx="18"
            cy="18"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
      </svg>

      <div
        className={`absolute font-bold ${text}`}
        style={{ color: solidColor }}
      >
        {percentage}<span className="text-[0.6em] align-super">%</span>
      </div>
    </div>
  );
};

export default ScoreStar;