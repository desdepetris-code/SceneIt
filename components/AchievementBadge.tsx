
import React from 'react';
import { UserAchievementStatus } from '../types';
import { BadgeIcon } from './Icons';

interface AchievementBadgeProps {
  achievement: UserAchievementStatus;
  isPending: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, isPending }) => {
  const { name, description, unlocked, progress, goal, reward, adminApprovalRequired } = achievement;
  
  const progressPercent = goal > 0 ? Math.min((progress / goal) * 100, 100) : 0;

  return (
    <div className={`p-4 rounded-lg flex flex-col justify-between ${unlocked ? 'bg-bg-secondary' : 'bg-bg-secondary/50'}`}>
      <div className="flex items-start space-x-4">
        <BadgeIcon className={`h-8 w-8 flex-shrink-0 mt-1 ${unlocked ? 'text-primary-accent' : 'text-text-secondary/30'}`} />
        <div>
          <h4 className={`font-bold ${unlocked ? 'text-text-primary' : 'text-text-secondary/50'}`}>{name}</h4>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        {unlocked ? (
          <div className="text-center">
            {reward !== 'none' && adminApprovalRequired && isPending && (
                <p className="text-xs font-semibold text-yellow-500">Awaiting Admin Approval</p>
            )}
            {reward !== 'none' && (!adminApprovalRequired || !isPending) && (
                 <p className="text-xs font-semibold text-primary-accent">Reward: {reward === 'vipPass' ? 'VIP Pass' : 'VIP Feature'}</p>
            )}
            {reward === 'none' && (
                <p className="text-xs font-semibold text-green-500">Unlocked!</p>
            )}
          </div>
        ) : (
          <div>
            <div className="w-full bg-bg-primary rounded-full h-1.5">
              <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-xs text-right text-text-secondary mt-1">{Math.min(progress, goal)} / {goal}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementBadge;
