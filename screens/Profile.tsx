
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { UserData, HistoryItem, TrackedItem, WatchStatus, FavoriteEpisodes, ProfileTab, NotificationSettings, CustomList, Theme, WatchProgress, EpisodeRatings, UserRatings, Follows, PrivacySettings, AppNotification, ProfileTheme, SeasonRatings } from '../types';
import { UserIcon, StarIcon, BookOpenIcon, ClockIcon, BadgeIcon, CogIcon, CloudArrowUpIcon, CollectionIcon, ListBulletIcon, HeartIcon, SearchIcon, ChatBubbleOvalLeftEllipsisIcon, XMarkIcon, MegaphoneIcon, Squares2X2Icon, ChartPieIcon, InformationCircleIcon, BellIcon, TvIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, EllipsisVerticalIcon, PencilSquareIcon } from '../components/Icons';
import ImportsScreen from './ImportsScreen';
import AchievementsScreen from './AchievementsScreen';
// Changed to a named import to resolve a module resolution issue.
import { Settings } from './Settings';
import SeasonLogScreen from '../components/SeasonLogScreen';
import MyListsScreen from './MyListsScreen';
import HistoryScreen from './HistoryScreen';
import JournalWidget from '../components/profile/JournalWidget';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
import OverviewStats from '../components/profile/OverviewStats';
import StatsNarrative from '../components/StatsNarrative';
import StatsScreen from './StatsScreen';
import FollowListModal from '../components/FollowListModal';
import FriendsActivity from '../components/profile/FriendsActivity';
import LibraryScreen from './LibraryScreen';
import NotificationsScreen from './NotificationsScreen';
import RecentActivityWidget from '../components/profile/RecentActivityWidget';
import AchievementsWidget from '../components/profile/AchievementsWidget';
import ListsWidget from '../components/profile/ListsWidget';
import ActivityScreen from './ActivityScreen';
import { PLACEHOLDER_PROFILE } from '../constants';

interface User {
  id: string;
  username: string;
  email: string;
}

interface ProfilePictureModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUrl: string | null;
    onSave: (url: string | null) => void;
}

const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({ isOpen, onClose, currentUrl, onSave }) => {
    const [url, setUrl] = useState(currentUrl || '');
    const [isUploading, setIsUploading] = useState(false);

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

    const handleSave = () => {
        onSave(url || null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold mb-4">Update Profile Picture</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-text-secondary mb-1 block">Image URL</label>
                        <p className="text-xs text-text-secondary/80 mb-2">Paste a direct link to an image (e.g., .gif, .png, .jpg).</p>
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
                    <button onClick={handleSave} disabled={isUploading} className="px-4 py-2 rounded-md bg-accent-gradient text-on-accent disabled:opacity-50">
                        {isUploading ? 'Uploading...' : 'Save'}
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
  onImportCompleted: (historyItems: HistoryItem[], completedItems: TrackedItem[]) => void;
  onTraktImportCompleted: (data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    watchProgress: WatchProgress;
    ratings: UserRatings;
  }) => void;
  onTmdbImportCompleted: (data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    favorites: TrackedItem[];
    ratings: UserRatings;
  }) => void;
  onToggleEpisode: (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
  initialTab?: ProfileTab;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  onDeleteHistoryItem: (item: HistoryItem) => void;
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
  // Corrected the signature of onForgotPasswordReset to match its implementation.
  onForgotPasswordReset: (data: { code: string; newPassword: string; }) => Promise<string | null>;
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
  autoHolidayThemesEnabled: boolean;
  setAutoHolidayThemesEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  holidayAnimationsEnabled: boolean;
  setHolidayAnimationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  profileTheme: ProfileTheme | null;
  setProfileTheme: React.Dispatch<React.SetStateAction<ProfileTheme | null>>;
  textSize: number;
  setTextSize: React.Dispatch<React.SetStateAction<number>>;
  onFeedbackSubmit: () => void;
  levelInfo: {
      level: number;
      xp: number;
      xpForNextLevel: number;
      xpProgress: number;
      progressPercent: number;
  };
  timeFormat: '12h' | '24h';
  setTimeFormat: React.Dispatch<React.SetStateAction<'12h' | '24h'>>;
  pin: string | null;
  setPin: React.Dispatch<React.SetStateAction<string | null>>;
  showRatings: boolean;
  setShowRatings: React.Dispatch<React.SetStateAction<boolean>>;
  setSeasonRatings: React.Dispatch<React.SetStateAction<SeasonRatings>>;
}

const Profile: React.FC<ProfileProps> = (props) => {
  const { userData, genres, onSelectShow, initialTab = 'overview', currentUser, onAuthClick, onLogout, profilePictureUrl, setProfilePictureUrl, onTraktImportCompleted, onTmdbImportCompleted, follows, onSelectUser, privacySettings, setPrivacySettings, onForgotPasswordRequest, onForgotPasswordReset, timezone, setTimezone, profileTheme, levelInfo, onFeedbackSubmit, timeFormat, setTimeFormat, onDeleteHistoryItem, pin, setPin } = props;
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [isPicModalOpen, setIsPicModalOpen] = useState(false);
  const [followModalState, setFollowModalState] = useState<{isOpen: boolean, title: string, userIds: string[]}>({isOpen: false, title: '', userIds: []});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const stats = useCalculatedStats(userData);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - 1); // -1 for buffer
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);

      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [checkScrollability]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };


  const { followers, following } = useMemo(() => {
    if (!currentUser) return { followers: [], following: [] };
    const followingList = follows[currentUser.id] || [];
    const followerList = Object.keys(follows).filter(userId => follows[userId]?.includes(currentUser.id));
    return { followers: followerList, following: followingList };
  }, [currentUser, follows]);

  const tabs: { id: ProfileTab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'overview', label: 'Overview', icon: Squares2X2Icon },
    { id: 'library', label: 'Library', icon: CollectionIcon },
    { id: 'lists', label: 'Custom Lists', icon: ListBulletIcon },
    { id: 'history', label: 'History', icon: ClockIcon },
    { id: 'activity', label: 'Activity', icon: UsersIcon },
    { id: 'stats', label: 'Stats', icon: ChartPieIcon },
    { id: 'seasonLog', label: 'Season Log', icon: TvIcon },
    { id: 'journal', label: 'Journal', icon: BookOpenIcon },
    { id: 'achievements', label: 'Achievements', icon: BadgeIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <StatsNarrative stats={stats} genres={genres} userData={userData} currentUser={currentUser} />
            <OverviewStats stats={stats} />
            <FriendsActivity 
              currentUser={props.currentUser}
              follows={props.follows}
              onSelectShow={onSelectShow}
              onSelectUser={props.onSelectUser}
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <RecentActivityWidget history={userData.history} onSelectShow={onSelectShow} />
            <AchievementsWidget userData={userData} onNavigate={() => setActiveTab('achievements')} />
            <ListsWidget watching={userData.watching} planToWatch={userData.planToWatch} onNavigate={() => setActiveTab('lists')} />
            <JournalWidget userData={userData} onSelectShow={onSelectShow} onNavigate={() => setActiveTab('journal')} />
          </div>
        </div>
      );
      case 'library': return <LibraryScreen userData={userData} genres={genres} onSelectShow={onSelectShow} />;
      case 'activity': return <ActivityScreen currentUser={props.currentUser} follows={props.follows} onSelectShow={onSelectShow} onSelectUser={props.onSelectUser} />;
      case 'stats': return <StatsScreen userData={userData} genres={genres} />;
      case 'lists': return <MyListsScreen userData={userData} onSelectShow={onSelectShow} setCustomLists={props.setCustomLists} />;
      case 'history': return <HistoryScreen userData={userData} onSelectShow={onSelectShow} onDeleteHistoryItem={onDeleteHistoryItem} onDeleteSearchHistoryItem={props.onDeleteSearchHistoryItem} onClearSearchHistory={props.onClearSearchHistory} genres={genres} timezone={timezone} />;
      case 'seasonLog': return <SeasonLogScreen userData={userData} onSelectShow={onSelectShow} />;
      case 'journal': return <JournalWidget userData={userData} onSelectShow={onSelectShow} isFullScreen />;
      case 'achievements': return <AchievementsScreen userData={userData} />;
      case 'notifications': return <NotificationsScreen notifications={props.notifications} onMarkAllRead={props.onMarkAllRead} onMarkOneRead={props.onMarkOneRead} onSelectShow={props.onSelectShow} onSelectUser={props.onSelectUser} />;
      case 'imports': return <ImportsScreen onImportCompleted={props.onImportCompleted} onTraktImportCompleted={onTraktImportCompleted} onTmdbImportCompleted={onTmdbImportCompleted} />;
      // Corrected the call to the Settings component, passing required props and fixing a syntax error from an incomplete file.
      case 'settings': return <Settings {...props} userLevel={levelInfo.level} />;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-8">
        <ProfilePictureModal isOpen={isPicModalOpen} onClose={() => setIsPicModalOpen(false)} currentUrl={profilePictureUrl} onSave={setProfilePictureUrl} />
        <FollowListModal isOpen={followModalState.isOpen} onClose={() => setFollowModalState({isOpen: false, title: '', userIds: []})} title={followModalState.title} userIds={followModalState.userIds} onSelectUser={onSelectUser} />
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-6">
            <div className="relative group flex-shrink-0" onClick={() => setIsPicModalOpen(true)}>
                <img src={profilePictureUrl || PLACEHOLDER_PROFILE} alt="Profile" className="w-32 h-32 rounded-full object-cover bg-bg-secondary border-4 border-bg-primary cursor-pointer" />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PencilSquareIcon className="w-8 h-8 text-white" />
                </div>
            </div>
            <div className="flex-grow text-center md:text-left">
                {currentUser ? (
                    <>
                        <h1 className="text-3xl font-bold text-text-primary">{currentUser.username}</h1>
                        <p className="text-sm text-text-secondary">{currentUser.email}</p>
                        <div className="flex justify-center md:justify-start space-x-4 mt-2">
                            <button onClick={() => setFollowModalState({isOpen: true, title: 'Followers', userIds: followers})} className="text-sm"><strong className="text-text-primary">{followers.length}</strong> Followers</button>
                            <button onClick={() => setFollowModalState({isOpen: true, title: 'Following', userIds: following})} className="text-sm"><strong className="text-text-primary">{following.length}</strong> Following</button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold text-text-primary">Guest Profile</h1>
                        <button onClick={onAuthClick} className="mt-2 text-sm font-semibold text-primary-accent hover:underline">Log in or Sign up to sync your data</button>
                    </>
                )}
            </div>
            <div className="flex-shrink-0 flex items-center space-x-2">
                {currentUser && (
                    <div className="flex items-center space-x-2 bg-bg-secondary p-1 rounded-full">
                        <span className="text-xs font-semibold px-2">{isPublic ? 'Public Profile' : 'Private Profile'}</span>
                        <ToggleSwitch enabled={isPublic} onChange={handlePrivacyToggle} />
                    </div>
                )}
                {currentUser && (
                    <div className="relative">
                        <button onClick={() => setIsDropdownOpen(p => !p)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} className="p-2 rounded-full bg-bg-secondary hover:brightness-125">
                            <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-primary border border-bg-secondary rounded-md shadow-lg z-10">
                                <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">Log Out</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 relative">
            {canScrollLeft && <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-backdrop rounded-full text-white"><ChevronLeftIcon className="w-6 h-6"/></button>}
            <div ref={scrollContainerRef} className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors ${activeTab === tab.id ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-secondary hover:brightness-125'}`}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
            {canScrollRight && <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-backdrop rounded-full text-white"><ChevronRightIcon className="w-6 h-6"/></button>}
        </div>

        {renderContent()}
    </div>
  );
};

export default Profile;
