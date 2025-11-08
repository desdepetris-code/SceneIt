// components/ShowAchievementBadge.tsx
import React from 'react';
import { BadgeIcon } from './Icons';

interface ShowAchievementBadgeProps {
  name: string;
  description: string;
  unlocked: boolean;
  unlockDate: string | null;
}

const ShowAchievementBadge: React.FC<ShowAchievementBadgeProps> = ({ name, description, unlocked, unlockDate }) => {
  return (
    <div className={`p-4 rounded-lg flex items-start space-x-4 ${unlocked ? 'bg-bg-secondary' : 'bg-bg-secondary/50 opacity-60'}`}>
      <BadgeIcon className={`h-10 w-10 flex-shrink-0 mt-1 ${unlocked ? 'text-primary-accent' : 'text-text-secondary/30'}`} />
      <div>
        <h4 className={`font-bold ${unlocked ? 'text-text-primary' : 'text-text-secondary/50'}`}>{name}</h4>
        <p className="text-sm text-text-secondary">{description}</p>
        {unlocked && unlockDate && (
          <p className="text-xs text-green-400 mt-1">
            Unlocked on {new Date(unlockDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ShowAchievementBadge;
