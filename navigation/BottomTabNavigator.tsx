import React from 'react';
import { HomeIcon, SearchNavIcon, BookOpenIcon, UserIcon, CalendarIcon, TrophyIcon, ClockIcon, CollectionIcon, ListBulletIcon, UsersIcon, ChartPieIcon, TvIcon, BadgeIcon, MountainIcon } from '../components/Icons';
import { NavSettings, ProfileTab } from '../types';

interface BottomTabNavigatorProps {
  activeTab: string;
  activeProfileTab?: ProfileTab;
  onTabPress: (tab: string) => void;
  profilePictureUrl: string | null;
  navSettings: NavSettings;
}

const iconMetadata: Record<string, { label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
  home: { label: 'Home', icon: HomeIcon },
  search: { label: 'Search', icon: SearchNavIcon },
  calendar: { label: 'Calendar', icon: CalendarIcon },
  profile: { label: 'Profile', icon: UserIcon },
  progress: { label: 'Progress', icon: MountainIcon },
  history: { label: 'History', icon: ClockIcon },
  weeklyPicks: { label: 'Gems', icon: TrophyIcon },
  library: { label: 'Library', icon: CollectionIcon },
  lists: { label: 'Lists', icon: ListBulletIcon },
  activity: { label: 'Activity', icon: UsersIcon },
  stats: { label: 'Stats', icon: ChartPieIcon },
  seasonLog: { label: 'Log', icon: TvIcon },
  journal: { label: 'Journal', icon: BookOpenIcon },
  achievements: { label: 'Awards', icon: BadgeIcon },
};

const TabButton: React.FC<{
  id: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  onPress: () => void;
  isProfileTab?: boolean;
  profilePictureUrl?: string | null;
  isVertical?: boolean;
}> = ({ label, icon: Icon, isActive, onPress, isProfileTab, profilePictureUrl, isVertical }) => {
    const iconContent = () => {
        if (isProfileTab && profilePictureUrl) {
            return <img src={profilePictureUrl} alt="Profile" className={`w-6 h-6 rounded-full object-cover border-2 ${isActive ? 'border-white' : 'border-transparent'}`} />
        }
        return <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />;
    };
    
    return (
        <button
            onClick={onPress}
            className={`flex transition-all duration-300 ${isVertical ? 'flex-row items-center w-full px-3 py-3 gap-3' : 'flex-col items-center justify-center w-full pt-2 pb-1'} ${
            isActive ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
            aria-label={label}
        >
            {iconContent()}
            <span className={`text-[9px] uppercase font-black tracking-widest truncate ${isVertical ? 'text-xs opacity-100 flex-grow text-left' : 'mt-1 w-full text-center px-1 ' + (isActive ? 'opacity-100' : 'opacity-60')}`}>{label}</span>
            {isVertical && isActive && <div className="w-1 h-5 bg-white rounded-full"></div>}
        </button>
    );
};

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ activeTab, activeProfileTab, onTabPress, profilePictureUrl, navSettings }) => {
  const isHorizontal = navSettings.position === 'bottom';
  const isVertical = !isHorizontal;

  const positionClasses = {
      bottom: "bottom-0 left-0 right-0 h-16 flex-row",
      left: "top-0 left-0 bottom-0 w-16 flex-col pt-20",
      right: "top-0 right-0 bottom-0 w-16 flex-col pt-20",
  }[navSettings.position];

  const hoverClasses = navSettings.hoverRevealNav ? "opacity-0 hover:opacity-100 transition-opacity duration-300" : "opacity-100";

  return (
    <nav className={`fixed z-40 overflow-hidden nav-spectral-bg animate-spectral-flow shadow-2xl flex ${positionClasses} ${hoverClasses}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>
      <div className={`container mx-auto flex h-full relative z-10 px-1 ${isVertical ? 'flex-col py-4' : 'flex-row justify-around items-center'}`}>
        {navSettings.tabs.map(tabId => {
          const meta = iconMetadata[tabId];
          if (!meta) return null;

          const isActive = tabId === 'profile' 
            ? (activeTab === 'profile' && !activeProfileTab)
            : (activeTab === tabId || activeProfileTab === tabId);

          return (
            <TabButton
              key={tabId}
              id={tabId}
              label={meta.label}
              icon={meta.icon}
              isActive={isActive}
              onPress={() => onTabPress(tabId)}
              isProfileTab={tabId === 'profile'}
              profilePictureUrl={profilePictureUrl}
              isVertical={isVertical}
            />
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabNavigator;