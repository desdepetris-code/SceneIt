import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { UserData, HistoryItem, TrackedItem, WatchStatus, FavoriteEpisodes, ProfileTab, NotificationSettings, CustomList, Theme, WatchProgress, EpisodeRatings, UserRatings, Follows, PrivacySettings, AppNotification, ProfileTheme } from '../types';
import { UserIcon, StarIcon, BookOpenIcon, ClockIcon, BadgeIcon, CogIcon, CloudArrowUpIcon, CollectionIcon, ListBulletIcon, HeartIcon, SearchIcon, ChatBubbleOvalLeftEllipsisIcon, XMarkIcon, MegaphoneIcon, Squares2X2Icon, ChartPieIcon, InformationCircleIcon, BellIcon, TvIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, EllipsisVerticalIcon } from '../components/Icons';
import ImportsScreen from './ImportsScreen';
import AchievementsScreen from './AchievementsScreen';
// FIX: Changed to a named import to resolve a module resolution issue.
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
  onToggleEpisode: (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
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
}

const Profile: React.FC<ProfileProps> = (props) => {
  const { userData, genres, onSelectShow, initialTab = 'overview', currentUser, onAuthClick, onLogout, profilePictureUrl, setProfilePictureUrl, onTraktImportCompleted, follows, onSelectUser, privacySettings, setPrivacySettings, onForgotPasswordRequest, onForgotPasswordReset, timezone, setTimezone, profileTheme, levelInfo, onFeedbackSubmit, timeFormat, setTimeFormat } = props;
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
    { id: 'activity', label: 'Activity', icon: UsersIcon },
    { id: 'stats', label: 'Stats', icon: ChartPieIcon },
    { id: 'history', label: 'History', icon: ClockIcon },
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
      case 'history': return <HistoryScreen userData={userData} onSelectShow={onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} onDeleteSearchHistoryItem={props.onDeleteSearchHistoryItem} onClearSearchHistory={props.onClearSearchHistory} genres={genres} timezone={timezone} />;
      case 'seasonLog': return <SeasonLogScreen userData={userData} onSelectShow={onSelectShow} />;
      case 'journal': return <JournalWidget userData={userData} onSelectShow={onSelectShow} isFullScreen />;
      case 'achievements': return <AchievementsScreen userData={userData} />;
      case 'notifications': return <NotificationsScreen notifications={props.notifications} onMarkAllRead={props.onMarkAllRead} onMarkOneRead={props.onMarkOneRead} onSelectShow={props.onSelectShow} onSelectUser={props.onSelectUser} />;
      case 'imports': return <ImportsScreen onImportCompleted={props.onImportCompleted} onTraktImportCompleted={onTraktImportCompleted} />;
      case 'settings': return <Settings {...props} onFeedbackSubmit={onFeedbackSubmit} currentUser={currentUser} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} timezone={timezone} setTimezone={setTimezone} userLevel={levelInfo.level} timeFormat={timeFormat} setTimeFormat={setTimeFormat} />;
      default: return <StatsScreen userData={userData} genres={genres} />;
    }
  };

  const defaultAvatar = (
    <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center border-2 border-primary-accent/30">
        <UserIcon className="w-10 h-10 text-text-primary" />
    </div>
  );

  const wrapperStyle: React.CSSProperties = profileTheme?.backgroundImage ? {
    backgroundImage: `url(${profileTheme.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  } : {};

  return (
    <div style={wrapperStyle} className="relative bg-bg-primary">
      {profileTheme?.backgroundImage && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>}
      <div className="relative animate-fade-in max-w-6xl mx-auto px-4 pb-8" style={{ fontFamily: profileTheme?.fontFamily || 'inherit' }}>
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
                        <div className="mt-2 w-full max-w-sm mx-auto sm:mx-0">
                            <div className="flex justify-between items-center text-sm font-semibold">
                                <span className="text-text-primary">Level {levelInfo.level}</span>
                                <span className="text-text-secondary">{levelInfo.xpProgress} / {levelInfo.xpForNextLevel} XP</span>
                            </div>
                            <div className="w-full bg-bg-secondary rounded-full h-2.5 mt-1">
                                <div className="bg-accent-gradient h-2.5 rounded-full" style={{ width: `${levelInfo.progressPercent}%` }}></div>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-center sm:justify-start items-center space-x-4">
                           <button onClick={() => setFollowModalState({isOpen: true, title: 'Followers', userIds: followers})} className="text-sm">
                               <strong className="text-text-primary">{followers.length}</strong> <span className="text-text-secondary">Followers</span>
                           </button>
                           <button onClick={() => setFollowModalState({isOpen: true, title: 'Following', userIds: following})} className="text-sm">
                               <strong className="text-text-primary">{following.length}</strong> <span className="text-text-secondary">Following</span>
                           </button>
                           <div className="text-sm">
                                <strong className="text-text-primary">{stats.longestStreak}</strong> <span className="text-text-secondary">Day Streak 🔥</span>
                            </div>
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
          
          <div className="mb-6 border-b border-bg-secondary/50">
            <div className="flex items-center">
                <div className="relative group flex-grow overflow-hidden">
                    {canScrollLeft && (
                        <button 
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-backdrop rounded-full hidden md:block opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Scroll left"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                    )}
                    <div
                        ref={scrollContainerRef}
                        className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar"
                    >
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
                            )
                        })}
                    </div>
                    {canScrollRight && (
                        <button 
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-backdrop rounded-full hidden md:block opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Scroll right"
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>

                <div
                    className="relative flex-shrink-0 ml-2"
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDropdownOpen(false); }}
                >
                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        className="p-3 rounded-lg hover:bg-bg-secondary/30"
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                        aria-label="More profile sections"
                    >
                        <EllipsisVerticalIcon className="w-6 h-6" />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-bg-primary rounded-lg shadow-2xl border border-bg-secondary z-20 animate-fade-in">
                        <ul className="py-1 max-h-[70vh] overflow-y-auto">
                            {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <li key={tab.id}>
                                <button
                                    onClick={() => {
                                    setActiveTab(tab.id);
                                    setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-3 transition-colors ${
                                    activeTab === tab.id ? 'font-bold text-primary-accent bg-bg-secondary' : 'text-text-primary hover:bg-bg-secondary'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary-accent' : 'text-text-secondary'}`} />
                                    <span>{tab.label}</span>
                                </button>
                                </li>
                            );
                            })}
                        </ul>
                        </div>
                    )}
                </div>
            </div>
          </div>
          
          <main>
            {renderContent()}
          </main>
      </div>
    </div>
  );
};

export default Profile;