import React, { useState, useEffect } from 'react';
import { TrashIcon, ChevronRightIcon, ArrowPathIcon, UploadIcon, DownloadIcon } from '../components/Icons';
import FeedbackForm from '../components/FeedbackForm';
import Legal from './Legal';
import { NotificationSettings, Theme, WatchProgress, HistoryItem, EpisodeRatings, FavoriteEpisodes, TrackedItem, PrivacySettings, UserData, ProfileTheme } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ThemeSettings from '../components/ThemeSettings';
import ResetPasswordModal from '../components/ResetPasswordModal';
import TimezoneSettings from '../components/TimezoneSettings';
import { clearApiCache } from '../utils/cacheUtils';
import UpdateProfileModal from '../components/UpdateProfileModal';
import PinModal from '../components/PinModal';

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

const GoogleIcon: React.FC = () => (
    <svg viewBox="0 0 48 48" className="w-5 h-5">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

interface User {
    id: string;
    username: string;
    email: string;
}

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
    onUpdateProfile: (details: { username: string; email: string; }) => Promise<string | null>;
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
    pin: string | null;
    setPin: React.Dispatch<React.SetStateAction<string | null>>;
}

// FIX: Changed to a named export to resolve a module resolution issue.
export const Settings: React.FC<SettingsProps> = (props) => {
  const { onFeedbackSubmit, notificationSettings, setNotificationSettings, privacySettings, setPrivacySettings, setHistory, setWatchProgress, setEpisodeRatings, setFavoriteEpisodes, setTheme, setCustomThemes, onLogout, onUpdatePassword, onUpdateProfile, onForgotPasswordRequest, onForgotPasswordReset, currentUser, setCompleted, userData, timezone, setTimezone, onRemoveDuplicateHistory, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled, holidayAnimationsEnabled, setHolidayAnimationsEnabled, profileTheme, setProfileTheme, textSize, setTextSize, userLevel, timeFormat, setTimeFormat, pin, setPin } = props;
  const [activeView, setActiveView] = useState<'settings' | 'legal'>('settings');
  const [autoBackupEnabled, setAutoBackupEnabled] = useLocalStorage('autoBackupEnabled', false);
  const [lastLocalBackup, setLastLocalBackup] = useState<string | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

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
            // If master is turned off, turn off all others
            return Object.fromEntries(
                Object.keys(prev).map(k => [k, false])
            // FIX: Cast to 'unknown' first to resolve TypeScript conversion error.
            ) as unknown as NotificationSettings;
        }
         if (setting === 'masterEnabled' && newState.masterEnabled) {
            // If master is turned on, turn on all others
            return Object.fromEntries(
                Object.keys(prev).map(k => [k, true])
            // FIX: Cast to 'unknown' first to resolve TypeScript conversion error.
            ) as unknown as NotificationSettings;
        }
        return newState;
    });
  };

  const handleExportData = () => {
    try {
        const keysToExport = [
            'watching_list', 'plan_to_watch_list', 'completed_list', 'favorites_list',
            'watch_progress', 'history', 'custom_image_paths', 'notifications',
            'favorite_episodes', 'customThemes', 'trakt_token', 'themeId'
        ];
        
        const dataToExport: Record<string, any> = {};
        
        keysToExport.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    dataToExport[key] = item;
                } catch(e) {
                    console.error(`Could not read key ${key} for export`, e);
                }
            }
        });

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sceneit_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Data exported successfully!');

    } catch (e) {
        console.error('Failed to export data', e);
        alert('An error occurred during export.');
    }
  };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);

                if (window.confirm("Are you sure you want to import this data? This will overwrite your current local data.")) {
                    Object.keys(data).forEach(key => {
                        localStorage.setItem(key, data[key]);
                    });
                    localStorage.setItem('sceneit_import_success', 'true');
                    window.location.reload();
                }
            } catch (err) {
                alert("Failed to parse the backup file. It might be corrupted.");
            }
        };
        reader.readAsText(file);
    };

    const handleClearAllData = () => {
        if (window.confirm("ARE YOU ABSOLUTELY SURE? This will delete all your watch history, lists, settings, and progress. This cannot be undone.")) {
            localStorage.clear();
            window.location.reload();
        }
    };
    
    if (activeView === 'legal') {
        return <Legal onBack={() => setActiveView('settings')} />;
    }

    return (
        <>
        <UpdateProfileModal isOpen={isUpdateProfileModalOpen} onClose={() => setIsUpdateProfileModalOpen(false)} onSave={onUpdateProfile} currentUser={currentUser} />
        <PinModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} pin={pin} setPin={setPin} />
        <ResetPasswordModal isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} onSave={onUpdatePassword} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} currentUserEmail={currentUser?.email || ''} />
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Settings</h1>
            {currentUser && (
                <SettingsCard title="Account">
                    <SettingsRow title="Username & Email" subtitle={`${currentUser.username} • ${currentUser.email}`}>
                        <button onClick={() => setIsUpdateProfileModalOpen(true)} className="text-sm font-semibold text-primary-accent hover:underline">Edit</button>
                    </SettingsRow>
                    <SettingsRow title="Change Password" subtitle="Update your account password.">
                        <button onClick={() => setIsResetPasswordModalOpen(true)} className="text-sm font-semibold text-primary-accent hover:underline">Change</button>
                    </SettingsRow>
                    <SettingsRow title="Recovery PIN" subtitle={pin ? "PIN is set for account recovery" : "PIN is not set"}>
                        <button onClick={() => setIsPinModalOpen(true)} className="text-sm font-semibold text-primary-accent hover:underline">{pin ? 'Manage' : 'Set Up'}</button>
                    </SettingsRow>
                    <SettingsRow title="Log Out" subtitle="Sign out of your account.">
                         <button onClick={onLogout} className="text-sm font-semibold text-red-500 hover:underline">Log Out</button>
                    </SettingsRow>
                </SettingsCard>
            )}

            <SettingsCard title="Notifications & Preferences">
                <SettingsRow title="All Notifications" subtitle="Master toggle for all app notifications.">
                    <ToggleSwitch enabled={notificationSettings.masterEnabled} onChange={() => handleToggleNotification('masterEnabled')} />
                </SettingsRow>
                <SettingsRow title="New TV Episodes" subtitle="Notify when a show on your list airs a new episode.">
                    <ToggleSwitch enabled={notificationSettings.newEpisodes} onChange={() => handleToggleNotification('newEpisodes')} disabled={!notificationSettings.masterEnabled}/>
                </SettingsRow>
                <SettingsRow title="New Movie Releases" subtitle="Notify when a movie from a collection is released.">
                    <ToggleSwitch enabled={notificationSettings.movieReleases} onChange={() => handleToggleNotification('movieReleases')} disabled={!notificationSettings.masterEnabled}/>
                </SettingsRow>
                 <SettingsRow title="New Followers" subtitle="Notify when a user follows you.">
                    <ToggleSwitch enabled={notificationSettings.newFollowers} onChange={() => handleToggleNotification('newFollowers')} disabled={!notificationSettings.masterEnabled}/>
                </SettingsRow>
                 <SettingsRow title="Likes on Your Lists" subtitle="Notify when another user likes one of your public lists.">
                    <ToggleSwitch enabled={notificationSettings.listLikes} onChange={() => handleToggleNotification('listLikes')} disabled={!notificationSettings.masterEnabled}/>
                </SettingsRow>
                <SettingsRow title="App Updates & News" subtitle="Receive occasional updates about new features.">
                    <ToggleSwitch enabled={notificationSettings.appUpdates} onChange={() => handleToggleNotification('appUpdates')} disabled={!notificationSettings.masterEnabled}/>
                </SettingsRow>
                <SettingsRow title="Import/Sync Status" subtitle="Notify when a data import or sync is complete.">
                    <ToggleSwitch enabled={notificationSettings.importSyncCompleted} onChange={() => handleToggleNotification('importSyncCompleted')} disabled={!notificationSettings.masterEnabled}/>
                </SettingsRow>
                <SettingsRow title="Sounds" subtitle="Play a sound for new notifications.">
                    <ToggleSwitch enabled={notificationSettings.sounds} onChange={() => handleToggleNotification('sounds')} disabled={!notificationSettings.masterEnabled}/>
                </SettingsRow>
                <SettingsRow title="Show Watched Confirmation" subtitle="Display a confirmation banner when an item is marked as watched.">
                    <ToggleSwitch enabled={notificationSettings.showWatchedConfirmation} onChange={() => handleToggleNotification('showWatchedConfirmation')} />
                </SettingsRow>
            </SettingsCard>
            
            <SettingsCard title="Privacy">
                 <SettingsRow title="Activity Visibility" subtitle="Who can see your profile and activity.">
                    <div className="relative">
                        <select
                            value={privacySettings.activityVisibility}
                            onChange={(e) => setPrivacySettings({ activityVisibility: e.target.value as 'public' | 'followers' | 'private' })}
                            className="appearance-none bg-bg-secondary border-none rounded-md py-1 px-3 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        >
                            <option value="followers">Followers</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </SettingsRow>
            </SettingsCard>

            <ThemeSettings customThemes={props.customThemes} setCustomThemes={setCustomThemes} autoHolidayThemesEnabled={autoHolidayThemesEnabled} setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} holidayAnimationsEnabled={holidayAnimationsEnabled} setHolidayAnimationsEnabled={setHolidayAnimationsEnabled} profileTheme={profileTheme} setProfileTheme={setProfileTheme}/>

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
                <SettingsRow title="Export Data" subtitle="Download a JSON backup of all your data.">
                    <button onClick={handleExportData} className="p-2 rounded-full text-text-primary bg-bg-secondary hover:brightness-125"><DownloadIcon className="w-5 h-5"/></button>
                </SettingsRow>
                <SettingsRow title="Import Data" subtitle="Import a previously exported JSON backup.">
                    <label className="p-2 rounded-full text-text-primary bg-bg-secondary hover:brightness-125 cursor-pointer">
                        <UploadIcon className="w-5 h-5"/>
                        <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
                    </label>
                </SettingsRow>
                 <SettingsRow title="Auto Backup Locally" subtitle={lastLocalBackup ? `Last backup: ${new Date(parseInt(lastLocalBackup)).toLocaleString()}` : 'Backs up data to this browser daily.'}>
                    <ToggleSwitch enabled={autoBackupEnabled} onChange={setAutoBackupEnabled} />
                </SettingsRow>
                <SettingsRow title="Clear API Cache" subtitle="Force refetch all movie/show data. Your watch history is safe.">
                    <button onClick={clearApiCache} className="p-2 rounded-full text-text-primary bg-bg-secondary hover:brightness-125"><ArrowPathIcon className="w-5 h-5"/></button>
                </SettingsRow>
                <SettingsRow title="Remove Duplicate History" subtitle="Clean up any duplicate watch records.">
                    <button onClick={onRemoveDuplicateHistory} className="p-2 rounded-full text-text-primary bg-bg-secondary hover:brightness-125"><ArrowPathIcon className="w-5 h-5"/></button>
                </SettingsRow>
                <SettingsRow title="Clear All Data" subtitle="Permanently delete all data from this device." isDestructive>
                    <button onClick={handleClearAllData} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30"><TrashIcon className="w-5 h-5"/></button>
                </SettingsRow>
            </SettingsCard>
            
            <SettingsCard title="About & Feedback">
                <FeedbackForm onFeedbackSubmit={onFeedbackSubmit}/>
                <SettingsRow title="Legal" subtitle="Terms of Service & Privacy Policy" onClick={() => setActiveView('legal')}>
                    <ChevronRightIcon className="w-6 h-6"/>
                </SettingsRow>
            </SettingsCard>
        </div>
        </>
    );
};