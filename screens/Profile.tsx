
import React, { useState } from 'react';
import { UserData, DriveStatus, HistoryItem, TrackedItem, WatchStatus, FavoriteEpisodes, ProfileTab, NotificationSettings, CustomList } from '../types';
import { UserIcon, StarIcon, BookOpenIcon, ClockIcon, BadgeIcon, CogIcon, CloudArrowUpIcon, CollectionIcon, ChartBarIcon, ListBulletIcon } from '../components/Icons';
import ImportsScreen from './ImportsScreen';
import AchievementsScreen from './AchievementsScreen';
import Settings from './Settings';
import ProgressScreen from './ProgressScreen';
import SeasonLogScreen from '../components/SeasonLogScreen';
import MyListsScreen from './MyListsScreen';
import HistoryScreen from './HistoryScreen';
import StatsScreen from './StatsScreen';
import JournalWidget from '../components/profile/JournalWidget';


interface ProfileProps {
  userData: UserData;
  genres: Record<number, string>;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  driveStatus: DriveStatus;
  onDriveSignIn: () => void;
  onDriveSignOut: () => void;
  onBackupToDrive: () => void;
  onRestoreFromDrive: () => void;
  onImportCompleted: (historyItems: HistoryItem[], completedItems: TrackedItem[]) => void;
  onToggleEpisode: (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
  initialTab?: ProfileTab;
  isVip: boolean;
  vipExpiry: number | null;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  // FIX: Changed parameter type from 'timestamp' to 'logId' to match the implementation.
  onDeleteHistoryItem: (logId: string) => void;
}

const Profile: React.FC<ProfileProps> = (props) => {
  const { userData, genres, onSelectShow, initialTab = 'overview', isVip, vipExpiry } = props;
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <ChartBarIcon className="w-6 h-6" /> },
    { id: 'lists', label: 'My Lists', icon: <ListBulletIcon className="w-6 h-6" /> },
    { id: 'progress', label: 'Progress', icon: <BookOpenIcon className="w-6 h-6" /> },
    { id: 'history', label: 'History', icon: <ClockIcon className="w-6 h-6" /> },
    { id: 'seasonLog', label: 'Season Log', icon: <CollectionIcon className="w-6 h-6" /> },
    { id: 'journal', label: 'Journal', icon: <BookOpenIcon className="w-6 h-6" /> },
    { id: 'achievements', label: 'Achievements', icon: <BadgeIcon className="w-6 h-6" /> },
    { id: 'imports', label: 'Import & Sync', icon: <CloudArrowUpIcon className="w-6 h-6" /> },
    { id: 'settings', label: 'Settings', icon: <CogIcon className="w-6 h-6" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <StatsScreen userData={userData} genres={genres} />;
      case 'lists': return <MyListsScreen userData={userData} genres={genres} setCustomLists={props.setCustomLists} onSelectShow={onSelectShow} />;
      case 'progress': return <ProgressScreen {...props} />;
      case 'history': return <HistoryScreen history={userData.history} onSelectShow={onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} />;
      case 'seasonLog': return <SeasonLogScreen userData={userData} onSelectShow={onSelectShow} />;
      case 'journal': return <JournalWidget userData={userData} onSelectShow={onSelectShow} isFullScreen />;
      case 'achievements': return <AchievementsScreen userData={userData} />;
      case 'imports': return <ImportsScreen onImportCompleted={props.onImportCompleted} />;
      case 'settings': return <Settings {...props} />;
      default: return <StatsScreen userData={userData} genres={genres} />;
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 pb-8">
      <header className="flex items-center space-x-4 mb-8 p-4 bg-card-gradient rounded-lg">
        <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center border-2 border-primary-accent/30">
          <UserIcon className="w-10 h-10 text-text-primary" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
            {isVip && (
              <div className="flex items-center space-x-1 bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full text-xs font-bold">
                <StarIcon filled className="w-3 h-3" />
                <span>VIP</span>
              </div>
            )}
          </div>
          <p className="text-text-secondary text-sm">Manage your lists, history, and settings.</p>
          {isVip && vipExpiry && <p className="text-xs text-yellow-400 mt-1">VIP Pass expires: {new Date(vipExpiry).toLocaleDateString()}</p>}
        </div>
      </header>

      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar border-b border-bg-secondary/50">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 p-3 flex-shrink-0 w-24 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-bg-secondary text-text-primary'
                    : 'text-text-secondary hover:bg-bg-secondary/30'
                }`}
              >
                <div className={`transition-all duration-300 ${activeTab === tab.id ? 'text-primary-accent' : ''}`}>
                    {React.cloneElement(tab.icon as React.ReactElement, { fill: activeTab === tab.id ? 'url(#icon-gradient-accent)' : 'url(#icon-gradient-gold)' })}
                </div>
                <span className="text-xs font-semibold">{tab.label}</span>
              </button>
            ))}
        </div>
      </div>
      
      <main>
        {renderContent()}
      </main>

    </div>
  );
};

export default Profile;
