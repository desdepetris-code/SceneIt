
import React from 'react';
import { ProfileTab } from '../../types';
import { BookOpenIcon, ClockIcon, BadgeIcon, CogIcon, CloudArrowUpIcon, CollectionIcon } from '../Icons';

interface ProfileMenuWidgetProps {
    onSetView: (view: ProfileTab) => void;
}

const menuItems: { id: ProfileTab, label: string, icon: React.ReactNode }[] = [
    { id: 'progress', label: 'Full Progress', icon: <BookOpenIcon className="w-5 h-5" /> },
    { id: 'seasonLog', label: 'Season Log', icon: <CollectionIcon className="w-5 h-5" /> },
    { id: 'history', label: 'Full History', icon: <ClockIcon className="w-5 h-5" /> },
    { id: 'achievements', label: 'All Achievements', icon: <BadgeIcon className="w-5 h-5" /> },
    { id: 'imports', label: 'Import & Sync', icon: <CloudArrowUpIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <CogIcon className="w-5 h-5" /> },
];


const ProfileMenuWidget: React.FC<ProfileMenuWidgetProps> = ({ onSetView }) => {
    return (
        <div className="bg-card-gradient rounded-lg shadow-md">
             <h3 className="text-xl font-bold text-text-primary p-4">More Sections</h3>
             <div className="divide-y divide-bg-secondary">
                {menuItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => onSetView(item.id)}
                        className="w-full flex items-center space-x-3 p-3 text-left text-text-primary hover:bg-bg-secondary/50 transition-colors"
                    >
                        <span className="text-primary-accent">{item.icon}</span>
                        <span className="font-semibold text-sm">{item.label}</span>
                    </button>
                ))}
             </div>
        </div>
    );
};

export default ProfileMenuWidget;
