import React from 'react';

interface ScoreBadgeProps {
  score: number; // A score from 0 to 10
  voteCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, voteCount, size = 'md', className = '' }) => {
  if (!score || score <= 0) return null;
  const percentage = Math.round(score * 10);

  const sizeConfig = {
    xs: { container: 'w-8 h-8', text: 'text-xs' },
    sm: { container: 'w-10 h-10', text: 'text-sm' },
    md: { container: 'w-16 h-16', text: 'text-xl' },
    lg: { container: 'w-20 h-20', text: 'text-2xl' },
  };

  const { container, text } = sizeConfig[size];

  const progressColor = percentage >= 70 ? '#4ade80' : percentage >= 40 ? '#facc15' : '#f87171';
  const title = `User score: ${percentage}%` + (voteCount ? ` based on ${voteCount} votes` : '');
  
  const ticketPath = "M4,0 H32 C34.2,0 36,1.8 36,4 V14 A4,4 0 0 0 32,18 A4,4 0 0 0 36,22 V32 C36,34.2 34.2,36 32,36 H4 C1.8,36 0,34.2 0,32 V22 A4,4 0 0 0 4,18 A4,4 0 0 0 0,14 V4 C0,1.8 1.8,0 4,0 Z";
  
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${container} ${className}`} title={title}>
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <defs>
          <clipPath id={`clip-progress-${percentage}`}>
            <rect x="0" y={36 - (36 * percentage / 100)} width="36" height="36" />
          </clipPath>
        </defs>
        {/* Background Shape */}
        <path d={ticketPath} fill="var(--color-bg-secondary)" opacity="0.5" />
        {/* Progress Shape (Clipped) */}
        <path d={ticketPath} fill={progressColor} clipPath={`url(#clip-progress-${percentage})`} />
      </svg>
      <div 
        className={`absolute font-bold ${text}`}
        style={{ color: progressColor }}
      >
        {percentage}<span className="text-[0.6em] align-super">%</span>
      </div>
    </div>
  );
};

export default ScoreBadge;