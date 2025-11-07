import React from 'react';

interface ScoreStarProps {
  score: number; // A score from 0 to 10
  voteCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

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

  let circleColorClass = 'text-gray-400';
  if (percentage >= 70) circleColorClass = 'text-green-400';
  else if (percentage >= 40) circleColorClass = 'text-yellow-400';
  else circleColorClass = 'text-red-400';

  const textColor = 'text-white';
  const title = `User score: ${percentage}%` + (voteCount ? ` based on ${voteCount} votes` : '');
  
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${container} ${className}`} title={title}>
      {/* Background circle */}
      <div className="absolute inset-0 bg-bg-secondary rounded-full opacity-50"></div>

      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
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
            className={circleColorClass}
            cx="18"
            cy="18"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
      </svg>

      <div className={`absolute font-bold ${text} ${textColor} [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]`}>
        {percentage}<span className="text-[0.6em] align-super">%</span>
      </div>
    </div>
  );
};

export default ScoreStar;
