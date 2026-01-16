import React from 'react';
import { ScreenName, ProfileTab } from '../types';
import { HomeIcon, ClockIcon, BadgeIcon, CogIcon, CollectionIcon, TvIcon, ListBulletIcon, UsersIcon, ChartPieIcon, BookOpenIcon, TrophyIcon, MountainIcon } from './Icons';
import Carousel from './Carousel';

interface ShortcutNavigationProps {
  onShortcutNavigate: (tabId: string) => void;
  selectedTabs: ProfileTab[];
}

const tabMetadata: Record<ProfileTab | 'home', { label: string; icon: React.ReactNode }> = {
    home: { label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
    overview: { label: 'Overview', icon: <ChartPieIcon className="w-5 h-5" /> },
    progress: { label: 'Progress', icon: <MountainIcon className="w-5 h-5" /> },
    history: { label: 'History', icon: <ClockIcon className="w-5 h-5" /> },
    weeklyPicks: { label: 'Weekly Gems', icon: <TrophyIcon className="w-5 h-5" /> },
    library: { label: 'Library', icon: <CollectionIcon className="w-5 h-5" /> },
    lists: { label: 'Custom Lists', icon: <ListBulletIcon className="w-5 h-5" /> },
    activity: { label: 'Activity', icon: <UsersIcon className="w-5 h-5" /> },
    stats: { label: 'Stats', icon: <ChartPieIcon className="w-5 h-5" /> },
    seasonLog: { label: 'Season Log', icon: <TvIcon className="w-5 h-5" /> },
    journal: { label: 'Journal', icon: <BookOpenIcon className="w-5 h-5" /> },
    achievements: { label: 'Achievements', icon: <BadgeIcon className="w-5 h-5" /> },
    imports: { label: 'Import & Sync', icon: <CogIcon className="w-5 h-5" /> },
    settings: { label: 'Settings', icon: <CogIcon className="w-5 h-5" /> },
};

const ShortcutButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isActive?: boolean;
}> = ({ label, icon, onClick, isActive }) => {
    const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0";
    const activeClasses = "bg-accent-gradient text-on-accent font-semibold shadow-lg scale-105";
    const inactiveClasses = "bg-bg-secondary text-text-secondary hover:brightness-125 hover:text-text-primary";
    
    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

const ShortcutNavigation: React.FC<ShortcutNavigationProps> = ({ onShortcutNavigate, selectedTabs }) => {
  return (
    <div className="px-6 my-8">
        <Carousel>
            <div className="flex space-x-3 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
                <ShortcutButton 
                    label="Home"
                    icon={tabMetadata.home.icon}
                    isActive={true}
                    onClick={() => onShortcutNavigate('home')}
                />
                {selectedTabs.map(tabId => {
                    const meta = tabMetadata[tabId];
                    if (!meta) return null;
                    return (
                        <ShortcutButton 
                            key={tabId}
                            label={meta.label}
                            icon={meta.icon}
                            isActive={false}
                            onClick={() => onShortcutNavigate(tabId)}
                        />
                    );
                })}
                <div className="w-2 flex-shrink-0"></div>
            </div>
        </Carousel>
    </div>
  );
};

export default ShortcutNavigation;