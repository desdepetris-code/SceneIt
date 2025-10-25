import React from 'react';
import { BadgeIcon, ClockIcon } from './Icons';

interface TopShortcutsProps {
  onShowHistory: () => void;
  onShowAchievements: () => void;
}

const Shortcut: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center space-y-2 text-text-primary hover:text-primary-accent transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-24"
  >
    <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center group-hover:bg-primary-accent/20 transition-all duration-300 group-hover:shadow-[0_0_15px_var(--color-accent-primary)]">
      {icon}
    </div>
    <span className="text-xs font-semibold">{label}</span>
  </button>
);

const TopShortcuts: React.FC<TopShortcutsProps> = ({ onShowHistory, onShowAchievements }) => {
  return (
    <div className="px-6 mb-8">
      <h2 className="text-2xl font-bold text-text-primary mb-4">Quick Access</h2>
      <div className="flex items-center space-x-4">
        <Shortcut icon={<ClockIcon className="w-8 h-8" />} label="History" onClick={onShowHistory} />
        <Shortcut icon={<BadgeIcon className="w-8 h-8" />} label="Achievements" onClick={onShowAchievements} />
      </div>
    </div>
  );
};

export default TopShortcuts;