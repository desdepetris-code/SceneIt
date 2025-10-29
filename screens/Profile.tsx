import React, { useState, useMemo } from 'react';
import { UserData, DriveStatus, HistoryItem, TrackedItem, WatchStatus, FavoriteEpisodes, ProfileTab, NotificationSettings, CustomList, Theme, WatchProgress, EpisodeRatings, UserRatings, Follows, PrivacySettings, AppNotification } from '../types';
import { UserIcon, StarIcon, BookOpenIcon, ClockIcon, BadgeIcon, CogIcon, CloudArrowUpIcon, CollectionIcon, ListBulletIcon, HeartIcon, SearchIcon, ChatBubbleOvalLeftEllipsisIcon, XMarkIcon, MegaphoneIcon, Squares2X2Icon, ChartPieIcon, InformationCircleIcon, CalendarIcon, BellIcon } from '../components/Icons';
import ImportsScreen from './ImportsScreen';
import AchievementsScreen from './AchievementsScreen';
import Settings from './Settings';
import SeasonLogScreen from '../components/SeasonLogScreen';
import MyListsScreen from './MyListsScreen';
import HistoryScreen from './HistoryScreen';
import JournalWidget from '../components/profile/JournalWidget';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
import OverviewStats from '../components/profile/OverviewStats';
import StatsNarrative from '../components/StatsNarrative';
// FIX: Add missing import for StatsScreen component.
import StatsScreen from './StatsScreen';
import UpdatesScreen from './UpdatesScreen';
import FollowListModal from '../components/FollowListModal';
import FriendsActivity from '../components/profile/FriendsActivity';
import LibraryScreen from './LibraryScreen';
import NotificationsScreen from './NotificationsScreen';

interface User {
  id: string;
  username: string;
  email: string;
}

interface ProfilePictureModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUrl: string | null;
    onSave: (url: string) => void;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({ isOpen, onClose, currentUrl, onSave }) => {
    const [url, setUrl] = useState(currentUrl || '');
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessingUrl, setIsProcessingUrl] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file (e.g., JPG, PNG, GIF).');
                return;
            }
            setIsUploading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setUrl(reader.result as string);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!url) {
            onSave(''); // Allow clearing the picture
            onClose();
            return;
        }

        if (url.includes('tenor.com/view/')) {
            setIsProcessingUrl(true);
            try {
                // The platform provides a /proxy/ endpoint to bypass CORS
                const proxyUrl = `/proxy/${url.replace(/^https?:\/\//, '')}`;
                const response = await fetch(proxyUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch Tenor page, status: ${response.status}`);
                }
                const html = await response.text();
                // Use regex to find the content of the og:image meta tag
                const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
                if (ogImageMatch && ogImageMatch[1]) {
                    onSave(ogImageMatch[1]); // Save the direct GIF URL
                    onClose();
                } else {
                    alert("Could not automatically find the direct GIF URL from Tenor. Please try to find and paste the direct GIF URL (ending in .gif). You can often do this by right-clicking the GIF and selecting 'Copy Image Address'.");
                }
            } catch (error) {
                console.error('Error fetching Tenor GIF URL:', error);
                alert("There was a problem getting the GIF from the Tenor link. Please check your network or try pasting the direct GIF URL instead.");
            } finally {
                setIsProcessingUrl(false);
            }
        } else {
            // For all other URLs, save them directly
            onSave(url);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold mb-4">Update Profile Picture</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-text-secondary mb-1 block">Image URL</label>
                         <input
                            type="text"
                            placeholder="https://example.com/image.gif"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        />
                    </div>
                    <div className="text-center text-sm text-text-secondary">OR</div>
                    <div>
                         <label htmlFor="file-upload" className={`w-full text-center cursor-pointer p-3 rounded-md font-semibold transition-colors ${isUploading ? 'bg-bg-secondary' : 'bg-accent-gradient text-on-accent hover:opacity-90'}`}>
                            {isUploading ? 'Processing...' : 'Upload from Device'}
                         </label>
                        <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary">Cancel</button>
                    <button onClick={handleSave} disabled={isUploading || isProcessingUrl} className="px-4 py-2 rounded-md bg-accent-gradient text-on-accent disabled:opacity-50">
                        {isUploading ? 'Uploading...' : isProcessingUrl ? 'Processing URL...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ enabled, onChange, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${enabled ? 'bg-primary-accent' : 'bg-bg-secondary'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${enabled ? 'translate-x-5' : ''}`}/>
    </button>
);


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
  onTraktImportCompleted: (data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    watchProgress: WatchProgress;
    ratings: UserRatings;
  }) => void;
  onToggleEpisode: (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
  initialTab?: ProfileTab;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  onDeleteHistoryItem: (logId: string) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  setWatchProgress: React.Dispatch<React.SetStateAction<WatchProgress>>;
  setEpisodeRatings: React.Dispatch<React.SetStateAction<EpisodeRatings>>;
  setFavoriteEpisodes: React.Dispatch<React.SetStateAction<FavoriteEpisodes>>;
  setTheme: (themeId: string) => void;
  customThemes: Theme[];
  setCustomThemes: React.Dispatch<React.SetStateAction<Theme[]>>;
  onLogout: () => void;
  onUpdatePassword: (passwords: { currentPassword: string; newPassword: string; }) => Promise<string | null>;
  onUpdateProfile: (details: { username: string; email: string; }) => Promise<string | null>;
  currentUser: User | null;
  onAuthClick: () => void;
  onForgotPasswordRequest: (email: string) => Promise<string | null>;
  onForgotPasswordReset: (data: { code: string; newPassword: string }) => Promise<string | null>;
  profilePictureUrl: string | null;
  setProfilePictureUrl: (url: string | null) => void;
  setCompleted: React.Dispatch<React.SetStateAction<TrackedItem[]>>;
  follows: Follows;
  privacySettings: PrivacySettings;
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;
  onSelectUser: (userId: string) => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
  onRemoveDuplicateHistory: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
}

const Profile: React.FC<ProfileProps> = (props) => {
  const { userData, genres, onSelectShow, initialTab = 'overview', currentUser, onAuthClick, onLogout, profilePictureUrl, setProfilePictureUrl, onTraktImportCompleted, follows, onSelectUser, privacySettings, setPrivacySettings, onForgotPasswordRequest, onForgotPasswordReset, timezone, setTimezone } = props;
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [isPicModalOpen, setIsPicModalOpen] = useState(false);
  const [followModalState, setFollowModalState] = useState<{isOpen: boolean, title: string, userIds: string[]}>({isOpen: false, title: '', userIds: []});
  const stats = useCalculatedStats(userData);

  const { followers, following } = useMemo(() => {
    if (!currentUser) return { followers: [], following: [] };
    const followingList = follows[currentUser.id] || [];
    const followerList = Object.keys(follows).filter(userId => follows[userId].includes(currentUser.id));
    return { followers: followerList, following: followingList };
  }, [currentUser, follows]);

  // FIX: Changed type of `icon` to React.FC to allow direct rendering with props, avoiding React.cloneElement typing issues.
  const tabs: { id: ProfileTab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'overview', label: 'Overview', icon: Squares2X2Icon },
    { id: 'library', label: 'Library', icon: CollectionIcon },
    { id: 'lists', label: 'Custom Lists', icon: ListBulletIcon },
    { id: 'stats', label: 'Stats', icon: ChartPieIcon },
    { id: 'history', label: 'History', icon: ClockIcon },
    { id: 'seasonLog', label: 'Season Log', icon: CalendarIcon },
    { id: 'journal', label: 'Journal', icon: BookOpenIcon },
    { id: 'achievements', label: 'Achievements', icon: BadgeIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'updates', label: 'Updates', icon: InformationCircleIcon },
    { id: 'imports', label: 'Import & Sync', icon: CloudArrowUpIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  const isPublic = privacySettings.activityVisibility !== 'private';

  const handlePrivacyToggle = (newIsPublic: boolean) => {
      setPrivacySettings({
          activityVisibility: newIsPublic ? 'followers' : 'private'
      });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return (
        <div className="space-y-6">
            <StatsNarrative stats={stats} genres={genres} userData={userData} currentUser={currentUser} />
            <OverviewStats stats={stats} />
            <FriendsActivity 
              currentUser={currentUser}
              follows={props.follows}
              onSelectShow={onSelectShow}
              onSelectUser={props.onSelectUser}
            />
        </div>
      );
      case 'library': return <LibraryScreen userData={userData} genres={genres} onSelectShow={onSelectShow} />;
      case 'stats': return <StatsScreen userData={userData} genres={genres} />;
      case 'lists': return <MyListsScreen userData={userData} onSelectShow={onSelectShow} setCustomLists={props.setCustomLists} />;
      case 'history': return <HistoryScreen userData={userData} onSelectShow={onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} onDeleteSearchHistoryItem={props.onDeleteSearchHistoryItem} onClearSearchHistory={props.onClearSearchHistory} genres={genres} timezone={timezone} />;
      case 'seasonLog': return <SeasonLogScreen userData={userData} onSelectShow={onSelectShow} />;
      case 'journal': return <JournalWidget userData={userData} onSelectShow={onSelectShow} isFullScreen />;
      case 'achievements': return <AchievementsScreen userData={userData} />;
      case 'notifications': return <NotificationsScreen notifications={props.notifications} onMarkAllRead={props.onMarkAllRead} onMarkOneRead={props.onMarkOneRead} onSelectShow={props.onSelectShow} onSelectUser={props.onSelectUser} />;
      case 'updates': return <UpdatesScreen />;
      case 'imports': return <ImportsScreen onImportCompleted={props.onImportCompleted} onTraktImportCompleted={onTraktImportCompleted} />;
      case 'settings': return <Settings {...props} currentUser={currentUser} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} timezone={timezone} setTimezone={setTimezone} />;
      default: return <StatsScreen userData={userData} genres={genres} />;
    }
  };

  const defaultAvatar = (
    <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center border-2 border-primary-accent/30">
        <UserIcon className="w-10 h-10 text-text-primary" />
    </div>
  );

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 pb-8">
      <ProfilePictureModal isOpen={isPicModalOpen} onClose={() => setIsPicModalOpen(false)} currentUrl={profilePictureUrl} onSave={setProfilePictureUrl} />
      <FollowListModal {...followModalState} onClose={() => setFollowModalState({isOpen: false, title: '', userIds: []})} onSelectUser={onSelectUser}/>
      
      <header className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8 p-4 bg-card-gradient rounded-lg">
        <div className="relative group">
            {currentUser ? (
                <img src={profilePictureUrl || `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#64748b"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>')}`} alt="Profile" className="w-20 h-20 rounded-full object-cover bg-bg-secondary border-2 border-primary-accent/30"/>
            ) : defaultAvatar}
        </div>
        <div className="flex-grow text-center sm:text-left">
            {currentUser ? (
                <>
                    <h1 className="text-2xl font-bold text-text-primary">{currentUser.username}</h1>
                    <p className="text-text-secondary text-sm">Logged in as {currentUser.email}</p>
                    <div className="mt-2 flex justify-center sm:justify-start items-center space-x-4">
                       <button onClick={() => setFollowModalState({isOpen: true, title: 'Followers', userIds: followers})} className="text-sm">
                           <strong className="text-text-primary">{followers.length}</strong> <span className="text-text-secondary">Followers</span>
                       </button>
                       <button onClick={() => setFollowModalState({isOpen: true, title: 'Following', userIds: following})} className="text-sm">
                           <strong className="text-text-primary">{following.length}</strong> <span className="text-text-secondary">Following</span>
                       </button>
                    </div>
                    <div className="mt-2 flex justify-center sm:justify-start items-center space-x-2">
                        <ToggleSwitch enabled={isPublic} onChange={handlePrivacyToggle} />
                        <span className="text-sm text-text-secondary">{isPublic ? 'Profile is Public' : 'Profile is Private'}</span>
                    </div>
                    <div className="mt-2 flex justify-center sm:justify-start space-x-2">
                        <button onClick={() => setIsPicModalOpen(true)} className="px-3 py-1 text-xs font-semibold rounded-full bg-bg-secondary text-text-primary hover:brightness-125">Change Picture</button>
                        <button onClick={onLogout} className="px-3 py-1 text-xs font-semibold rounded-full bg-bg-secondary text-text-primary hover:brightness-125">Log Out</button>
                    </div>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-bold text-text-primary">Guest User</h1>
                    <p className="text-text-secondary text-sm">Log in to sync your data across devices.</p>
                     <div className="mt-2 flex justify-center sm:justify-start space-x-2">
                        <button onClick={onAuthClick} className="px-3 py-1 text-sm font-semibold rounded-full bg-accent-gradient text-on-accent hover:opacity-90">Login / Sign Up</button>
                    </div>
                </>
            )}
        </div>
      </header>

      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar border-b border-bg-secondary/50">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
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
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold">{tab.label}</span>
              </button>
            )})}
        </div>
      </div>
      
      <main>
        {renderContent()}
      </main>

    </div>
  );
};

export default Profile;