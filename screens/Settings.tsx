import React, { useState, useEffect } from 'react';
import { TrashIcon, ChevronRightIcon, ArrowPathIcon, UploadIcon, DownloadIcon, ChevronDownIcon, ChevronLeftIcon, PlusIcon, XMarkIcon } from '../components/Icons';
import FeedbackForm from '../components/FeedbackForm';
import Legal from './Legal';
import { NotificationSettings, Theme, WatchProgress, HistoryItem, EpisodeRatings, FavoriteEpisodes, TrackedItem, PrivacySettings, UserData, ProfileTheme, SeasonRatings, ShortcutSettings, NavSettings, ProfileTab, AppPreferences } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ThemeSettings from '../components/ThemeSettings';
import ResetPasswordModal from '../components/ResetPasswordModal';
import TimezoneSettings from '../components/TimezoneSettings';
import { clearApiCache } from '../utils/cacheUtils';

const SettingsRow: React.FC<{ title: string; subtitle: string; children: React.ReactNode; isDestructive?: boolean; onClick?: () => void, disabled?: boolean }> = ({ title, subtitle, children, isDestructive, onClick, disabled }) => (
    <div 
        className={`flex justify-between items-center p-4 border-b border-bg-secondary/50 last:border-b-0 ${isDestructive ? 'text-red-500' : ''} ${onClick && !disabled ? 'cursor-pointer hover:bg-bg-secondary/50' : ''} ${disabled ? 'opacity-50' : ''}`}
        onClick={disabled ? undefined : onClick}
    >
        <div>
            <h3 className={`font-semibold ${isDestructive ? '' : 'text-text-primary'}`}>{title}</h3>
            <p className="text-sm text-text-secondary">{subtitle}</p>
        </div>
        <div className="flex-shrink-0 ml-4">
            {children}
        </div>
    </div>
);

const SettingsCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden mb-8">
      <div className="p-4 border-b border-bg-secondary/50">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-accent-gradient">{title}</h2>
      </div>
      <div className="animate-fade-in">
        {children}
      </div>
    </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ enabled, onChange, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${enabled ? 'bg-primary-accent' : 'bg-bg-secondary'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${enabled ? 'translate-x-5' : ''}`}/>
    </button>
);

interface User {
    id: string;
    username: string;
    email: string;
}

const ALL_PROFILE_TABS: { id: ProfileTab; label: string }[] = [
    { id: 'progress', label: 'Progress' },
    { id: 'history', label: 'History' },
    { id: 'weeklyPicks', label: 'Weekly Picks' },
    { id: 'library', label: 'Library' },
    { id: 'lists', label: 'Custom Lists' },
    { id: 'activity', label: 'Activity' },
    { id: 'stats', label: 'Stats' },
    { id: 'seasonLog', label: 'Season Log' },
    { id: 'journal', label: 'Journal' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'imports', label: 'Import & Sync' },
];

interface SettingsProps {
    userData: UserData;
    notificationSettings: NotificationSettings;
    setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
    privacySettings: PrivacySettings;
    setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;
    setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
    setWatchProgress: React.Dispatch<React.SetStateAction<WatchProgress>>;
    setEpisodeRatings: React.Dispatch<React.SetStateAction<EpisodeRatings>>;
    setFavoriteEpisodes: React.Dispatch<React.SetStateAction<FavoriteEpisodes>>;
    setTheme: (themeId: string) => void;
    customThemes: Theme[];
    setCustomThemes: React.Dispatch<React.SetStateAction<Theme[]>>;
    onLogout: () => void;
    onUpdatePassword: (passwords: { currentPassword: string; newPassword: string; }) => Promise<string | null>;
    onForgotPasswordRequest: (email: string) => Promise<string | null>;
    onForgotPasswordReset: (data: { code: string; newPassword: string; }) => Promise<string | null>;
    currentUser: User | null;
    setCompleted: React.Dispatch<React.SetStateAction<TrackedItem[]>>;
    timezone: string;
    setTimezone: (timezone: string) => void;
    onRemoveDuplicateHistory: () => void;
    autoHolidayThemesEnabled: boolean;
    setAutoHolidayThemesEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    holidayAnimationsEnabled: boolean;
    setHolidayAnimationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    profileTheme: ProfileTheme | null;
    setProfileTheme: React.Dispatch<React.SetStateAction<ProfileTheme | null>>;
    textSize: number;
    setTextSize: React.Dispatch<React.SetStateAction<number>>;
    onFeedbackSubmit: () => void;
    userLevel: number;
    timeFormat: '12h' | '24h';
    setTimeFormat: React.Dispatch<React.SetStateAction<'12h' | '24h'>>;
    showRatings: boolean;
    setShowRatings: React.Dispatch<React.SetStateAction<boolean>>;
    setSeasonRatings: React.Dispatch<React.SetStateAction<SeasonRatings>>;
    pin: string | null;
    setPin: React.Dispatch<React.SetStateAction<string | null>>;
    shortcutSettings: ShortcutSettings;
    setShortcutSettings: React.Dispatch<React.SetStateAction<ShortcutSettings>>;
    navSettings: NavSettings;
    setNavSettings: React.Dispatch<React.SetStateAction<NavSettings>>;
    preferences: AppPreferences;
    setPreferences: React.Dispatch<React.SetStateAction<AppPreferences>>;
}

export const Settings: React.FC<SettingsProps> = (props) => {
  const { onFeedbackSubmit, notificationSettings, setNotificationSettings, privacySettings, setPrivacySettings, setHistory, setWatchProgress, setEpisodeRatings, setFavoriteEpisodes, setTheme, setCustomThemes, onLogout, onUpdatePassword, onForgotPasswordRequest, onForgotPasswordReset, currentUser, setCompleted, userData, timezone, setTimezone, onRemoveDuplicateHistory, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled, holidayAnimationsEnabled, setHolidayAnimationsEnabled, profileTheme, setProfileTheme, textSize, setTextSize, userLevel, timeFormat, setTimeFormat, showRatings, setShowRatings, setSeasonRatings, pin, setPin, shortcutSettings, setShortcutSettings, navSettings, setNavSettings, preferences, setPreferences } = props;
  const [activeView, setActiveView] = useState<'settings' | 'legal'>('settings');
  const [autoBackupEnabled, setAutoBackupEnabled] = useLocalStorage('autoBackupEnabled', false);
  const [lastLocalBackup, setLastLocalBackup] = useState<string | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('sceneit_import_success') === 'true') {
      alert('Data imported successfully!');
      localStorage.removeItem('sceneit_import_success');
    }
    setLastLocalBackup(localStorage.getItem('auto_backup_last_timestamp'));
  }, []);

  const handleToggleNotification = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => {
        const newState = { ...prev, [setting]: !prev[setting] };
        if (setting === 'masterEnabled' && !newState.masterEnabled) {
            return Object.fromEntries(Object.keys(prev).map(k => [k, false])) as unknown as NotificationSettings;
        }
        return newState;
    });
  };

  const handleTogglePreference = (key: keyof AppPreferences) => {
      setPreferences(prev => ({ ...prev, [key]: !prev[key] as any }));
  };

  const handleSeriesInfoPreference = (val: AppPreferences['searchShowSeriesInfo']) => {
      setPreferences(prev => ({ ...prev, searchShowSeriesInfo: val }));
  };

  const mandatoryNavIds = ['home', 'search', 'calendar', 'profile'];
    
  const moveNavTab = (index: number, direction: 'up' | 'down') => {
    const newTabs = [...navSettings.tabs];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newTabs.length) return;
    [newTabs[index], newTabs[swapIndex]] = [newTabs[swapIndex], newTabs[index]];
    setNavSettings({ ...navSettings, tabs: newTabs });
  };

  const removeNavTab = (tabId: string) => {
    if (mandatoryNavIds.includes(tabId)) return;
    setNavSettings({ ...navSettings, tabs: navSettings.tabs.filter(id => id !== tabId) });
  };

  const addNavTab = (tabId: ProfileTab) => {
    if (navSettings.tabs.length >= 7) {
        alert("Maximum 7 navigation icons allowed.");
        return;
    }
    if (navSettings.tabs.includes(tabId)) return;
    setNavSettings({ ...navSettings, tabs: [...navSettings.tabs, tabId] });
  };

  const toggleShortcutTab = (tabId: ProfileTab) => {
    setShortcutSettings(prev => {
        const isSelected = prev.tabs.includes(tabId);
        if (isSelected) return { ...prev, tabs: prev.tabs.filter(id => id !== tabId) };
        return { ...prev, tabs: [...prev.tabs, tabId] };
    });
  };

  if (activeView === 'legal') return <Legal onBack={() => setActiveView('settings')} />;

  return (
    <>
    <ResetPasswordModal isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} onSave={onUpdatePassword} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset as any} currentUserEmail={currentUser?.email || ''} />
    <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Settings</h1>
        
        <SettingsCard title="Feature Visibility">
            <div className="p-4 border-b border-bg-secondary/50">
                <p className="text-xs font-black uppercase tracking-widest text-primary-accent mb-4">Search Page Controls</p>
                <SettingsRow title="Enable Search Filters" subtitle="Whether to allow filtering on the search page at all.">
                    <ToggleSwitch enabled={preferences.searchShowFilters} onChange={() => handleTogglePreference('searchShowFilters')} />
                </SettingsRow>
                <SettingsRow title="Always Expand Filters" subtitle="When enabled, filters are visible immediately. When disabled, you must click the filter icon." disabled={!preferences.searchShowFilters}>
                    <ToggleSwitch enabled={preferences.searchAlwaysExpandFilters} onChange={() => handleTogglePreference('searchAlwaysExpandFilters')} />
                </SettingsRow>
                <SettingsRow title="Search Result Series Info" subtitle="Choose how seasons and episode details appear on results.">
                    <div className="relative">
                        <select 
                            value={preferences.searchShowSeriesInfo} 
                            onChange={(e) => handleSeriesInfoPreference(e.target.value as any)}
                            className="appearance-none bg-bg-secondary text-text-primary text-[10px] font-black uppercase py-2 pl-4 pr-10 rounded-xl focus:outline-none"
                        >
                            <option value="toggle">Use Dropdown Button</option>
                            <option value="expanded">Always Visible (Default)</option>
                            <option value="hidden">Hide Completely</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                    </div>
                </SettingsRow>
            </div>
            <div className="p-4">
                <p className="text-xs font-black uppercase tracking-widest text-primary-accent mb-4">Dashboard Widgets</p>
                <SettingsRow title="Stats Summary" subtitle="Display your quick watch stats.">
                    <ToggleSwitch enabled={preferences.dashShowStats} onChange={() => handleTogglePreference('dashShowStats')} />
                </SettingsRow>
                <SettingsRow title="Live Watch Player" subtitle="Show active watch sessions.">
                    <ToggleSwitch enabled={preferences.dashShowLiveWatch} onChange={() => handleTogglePreference('dashShowLiveWatch')} />
                </SettingsRow>
                <SettingsRow title="Continue Watching" subtitle="Quick access to your in-progress series.">
                    <ToggleSwitch enabled={preferences.dashShowContinueWatching} onChange={() => handleTogglePreference('dashShowContinueWatching')} />
                </SettingsRow>
                <SettingsRow title="Upcoming Releases" subtitle="Carousels for new and near-future content.">
                    <ToggleSwitch enabled={preferences.dashShowUpcoming} onChange={() => handleTogglePreference('dashShowUpcoming')} />
                </SettingsRow>
                <SettingsRow title="Recommendations" subtitle="AI and history-based title suggestions.">
                    <ToggleSwitch enabled={preferences.dashShowRecommendations} onChange={() => handleTogglePreference('dashShowRecommendations')} />
                </SettingsRow>
                <SettingsRow title="Trending Content" subtitle="What's currently popular on TMDB.">
                    <ToggleSwitch enabled={preferences.dashShowTrending} onChange={() => handleTogglePreference('dashShowTrending')} />
                </SettingsRow>
                <SettingsRow title="Weekly Gems (Hall of Fame)" subtitle="Your curated elite picks for the week.">
                    <ToggleSwitch enabled={preferences.dashShowWeeklyGems} onChange={() => handleTogglePreference('dashShowWeeklyGems')} />
                </SettingsRow>
            </div>
        </SettingsCard>

        <SettingsCard title="Dashboard Shortcuts">
            <SettingsRow title="Enable Shortcut Bar" subtitle="Toggle the shortcut bar at the top of the dashboard.">
                <ToggleSwitch enabled={shortcutSettings.show} onChange={(val) => setShortcutSettings({...shortcutSettings, show: val})} />
            </SettingsRow>
            {shortcutSettings.show && (
                <div className="p-4 bg-bg-secondary/20 border-t border-bg-secondary/50">
                    <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-3">Selected Shortcuts</p>
                    <div className="flex flex-wrap gap-2">
                        {ALL_PROFILE_TABS.map(tab => {
                            const isSelected = shortcutSettings.tabs.includes(tab.id);
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => toggleShortcutTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-secondary'}`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </SettingsCard>

        <SettingsCard title="Navigation Customization">
            <div className="p-4 space-y-4">
                <p className="text-sm text-text-secondary">Home, Search, Calendar, and Profile are mandatory. Max 7 icons total.</p>
                <div className="space-y-2">
                    {navSettings.tabs.map((tabId, index) => {
                        const isMandatory = mandatoryNavIds.includes(tabId);
                        const meta = ALL_PROFILE_TABS.find(t => t.id === tabId) || { label: tabId.charAt(0).toUpperCase() + tabId.slice(1) };
                        return (
                            <div key={tabId} className="flex items-center justify-between p-3 bg-bg-secondary/40 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-text-secondary opacity-50">#{index + 1}</span>
                                    <span className="font-bold text-text-primary">{meta.label} {isMandatory && <span className="text-[10px] opacity-40 ml-1">(Locked)</span>}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => moveNavTab(index, 'up')} disabled={index === 0} className="p-1 text-text-secondary hover:text-primary-accent disabled:opacity-20">
                                        <ChevronDownIcon className="w-4 h-4 rotate-180" />
                                    </button>
                                    <button onClick={() => moveNavTab(index, 'down')} disabled={index === navSettings.tabs.length - 1} className="p-1 text-text-secondary hover:text-primary-accent disabled:opacity-20">
                                        <ChevronDownIcon className="w-4 h-4" />
                                    </button>
                                    {!isMandatory && (
                                        <button onClick={() => removeNavTab(tabId)} className="p-1 text-red-400 hover:bg-red-500/20 rounded-md">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {navSettings.tabs.length < 7 && (
                    <div className="pt-4 border-t border-bg-secondary/50">
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-3">Add Custom Icon (Limit 2 additional)</p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_PROFILE_TABS.filter(tab => !navSettings.tabs.includes(tab.id)).map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => addNavTab(tab.id)}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-primary-accent/20"
                                >
                                    + {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SettingsCard>

        <SettingsCard title="Advanced Interface (Desktop Only)">
            <SettingsRow title="Navigation Position" subtitle="Place the menu bar at the bottom or as a sidebar.">
                <div className="flex p-1 bg-bg-primary rounded-full border border-bg-secondary">
                    {(['bottom', 'left', 'right'] as const).map(pos => (
                        <button key={pos} onClick={() => setNavSettings({...navSettings, position: pos})} className={`px-3 py-1 text-[10px] uppercase font-black rounded-full transition-all ${navSettings.position === pos ? 'bg-accent-gradient text-on-accent shadow-md' : 'text-text-secondary'}`}>
                            {pos}
                        </button>
                    ))}
                </div>
            </SettingsRow>
            <SettingsRow title="Hover-to-Reveal Navigation" subtitle="Keep the navigation menu hidden until you hover over it.">
                <ToggleSwitch enabled={navSettings.hoverRevealNav} onChange={(val) => setNavSettings({...navSettings, hoverRevealNav: val})} />
            </SettingsRow>
            <SettingsRow title="Hover-to-Reveal Header" subtitle="Keep the top search bar and logo hidden until you hover over it.">
                <ToggleSwitch enabled={navSettings.hoverRevealHeader} onChange={(val) => setNavSettings({...navSettings, hoverRevealHeader: val})} />
            </SettingsRow>
        </SettingsCard>

        {currentUser && (
            <SettingsCard title="Account">
                <SettingsRow title="Logged In As" subtitle={currentUser.email}>
                    <span className="text-sm font-semibold">{currentUser.username}</span>
                </SettingsRow>
                <SettingsRow title="Reset Password" subtitle="Change your current password.">
                    <button onClick={() => setIsResetPasswordModalOpen(true)} className="text-sm font-semibold text-primary-accent hover:underline">Change</button>
                </SettingsRow>
                <SettingsRow title="Log Out" subtitle="Sign out of your account.">
                     <button onClick={onLogout} className="text-sm font-semibold text-red-500 hover:underline">Log Out</button>
                </SettingsRow>
            </SettingsCard>
        )}

        <SettingsCard title="Display Preferences">
             <SettingsRow title="Show Ratings & Scores" subtitle="Display TMDB and user scores throughout the app.">
                <ToggleSwitch enabled={showRatings} onChange={setShowRatings} />
            </SettingsRow>
             <SettingsRow title="Show Watched Confirmation" subtitle="Display a banner when an item is marked as watched.">
                <ToggleSwitch enabled={notificationSettings.showWatchedConfirmation} onChange={() => handleToggleNotification('showWatchedConfirmation')} />
            </SettingsRow>
            <SettingsRow title="Smart Watch Logic" subtitle="Helpful popup when episodes are marked out of order.">
                <ToggleSwitch enabled={notificationSettings.showPriorEpisodesPopup} onChange={() => handleToggleNotification('showPriorEpisodesPopup')} />
            </SettingsRow>
            <SettingsRow title="Enable Spoiler Shield" subtitle="Blurs thumbnails and descriptions for unwatched episodes.">
                <ToggleSwitch enabled={preferences.enableSpoilerShield} onChange={() => handleTogglePreference('enableSpoilerShield')} />
            </SettingsRow>
        </SettingsCard>

        <ThemeSettings customThemes={props.customThemes} setCustomThemes={setCustomThemes} autoHolidayThemesEnabled={autoHolidayThemesEnabled} setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} holidayAnimationsEnabled={false} setHolidayAnimationsEnabled={() => {}} profileTheme={profileTheme} setProfileTheme={setProfileTheme}/>

        <SettingsCard title="Localization">
            <SettingsRow title="Time Format" subtitle="Display times in 12-hour or 24-hour format.">
                 <div className="flex p-1 bg-bg-primary rounded-full border border-bg-secondary">
                    <button onClick={() => setTimeFormat('12h')} className={`px-3 py-1 text-xs rounded-full ${timeFormat === '12h' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>12-hour</button>
                    <button onClick={() => setTimeFormat('24h')} className={`px-3 py-1 text-xs rounded-full ${timeFormat === '24h' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>24-hour</button>
                </div>
            </SettingsRow>
            <TimezoneSettings timezone={timezone} setTimezone={setTimezone} />
        </SettingsCard>

        <SettingsCard title="Data Management">
            <SettingsRow title="Clear API Cache" subtitle="Force refetch all movie/show data.">
                <button onClick={clearApiCache} className="p-2 rounded-full text-text-primary bg-bg-secondary hover:brightness-125"><ArrowPathIcon className="w-5 h-5"/></button>
            </SettingsRow>
            <SettingsRow title="Clear All Data" subtitle="Permanently delete all data from this device." isDestructive>
                <button onClick={() => { if(window.confirm("ARE YOU SURE?")) { localStorage.clear(); window.location.reload(); } }} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30"><TrashIcon className="w-5 h-5"/></button>
            </SettingsRow>
        </SettingsCard>
        
        <SettingsCard title="About & Feedback">
            <FeedbackForm onFeedbackSubmit={onFeedbackSubmit}/>
            <SettingsRow title="Legal" subtitle="Terms of Service & Privacy Policy" onClick={() => setActiveView('settings')}>
                <ChevronRightIcon className="w-6 h-6"/>
            </SettingsRow>
        </SettingsCard>
    </div>
    </>
  );
};