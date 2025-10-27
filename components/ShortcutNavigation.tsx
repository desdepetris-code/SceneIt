import React from 'react';
import { ScreenName, ProfileTab } from '../types';
import { HomeIcon, ClockIcon, BadgeIcon, CogIcon, ListBulletIcon } from './Icons';

interface ShortcutNavigationProps {
  onShortcutNavigate: (screen: ScreenName, profileTab?: ProfileTab) => void;
}

const ShortcutButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    isActive?: boolean;
}> = ({ label, icon, onClick, isActive }) => {
    const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0";
    const activeClasses = "bg-accent-gradient text-on-accent font-semibold shadow-lg";
    const inactiveClasses = "bg-bg-secondary text-text-secondary hover:brightness-125";
    
    const Component = isActive ? 'div' : 'button';

    return (
        <Component
            onClick={onClick}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon}
            <span>{label}</span>
        </Component>
    );
};

const ShortcutNavigation: React.FC<ShortcutNavigationProps> = ({ onShortcutNavigate }) => {
  const shortcuts: { id: ProfileTab | 'home'; label: string; icon: React.ReactNode; }[] = [
    { id: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'lists', label: 'My Lists', icon: <ListBulletIcon className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <ClockIcon className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <BadgeIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <CogIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="px-6 my-8">
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
            {shortcuts.map(shortcut => {
                // FIX: Abstracting the onClick logic ensures TypeScript correctly narrows the type of `shortcut.id`.
                const handleClick = () => {
                    if (shortcut.id !== 'home') {
                        onShortcutNavigate('profile', shortcut.id);
                    }
                };
                return (
                    <ShortcutButton 
                        key={shortcut.id}
                        label={shortcut.label}
                        icon={shortcut.icon}
                        isActive={shortcut.id === 'home'}
                        onClick={shortcut.id !== 'home' ? handleClick : undefined}
                    />
                );
            })}
            <div className="w-2 flex-shrink-0"></div>
        </div>
    </div>
  );
};

export default ShortcutNavigation;
