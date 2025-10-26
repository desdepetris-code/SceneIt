

import React from 'react';
import { HomeIcon, SparklesIcon, SearchNavIcon, ChartBarIcon, UserIcon } from '../components/Icons';
import { ScreenName } from '../types';

export type TabName = 'home' | 'recommendations' | 'search' | 'stats' | 'profile';

interface BottomTabNavigatorProps {
  activeTab: ScreenName;
  onTabPress: (tab: TabName) => void;
}

const tabs: { name: TabName; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { name: 'home', label: 'Home', icon: HomeIcon },
  { name: 'recommendations', label: 'Recs', icon: SparklesIcon },
  { name: 'search', label: 'Search', icon: SearchNavIcon },
  { name: 'stats', label: 'Stats', icon: ChartBarIcon },
  { name: 'profile', label: 'Profile', icon: UserIcon },
];

const TabButton: React.FC<{
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  onPress: () => void;
}> = ({ label, icon: Icon, isActive, onPress }) => (
  <button
    onClick={onPress}
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
      isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
    }`}
    aria-label={label}
  >
    <Icon className="w-6 h-6" />
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ activeTab, onTabPress }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-backdrop backdrop-blur-md shadow-lg border-t border-bg-secondary z-40">
      <div className="container mx-auto flex justify-around items-center h-full">
        {tabs.map(tab => (
          <TabButton
            key={tab.name}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.name}
            onPress={() => onTabPress(tab.name)}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomTabNavigator;