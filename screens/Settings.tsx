import React, { useState } from 'react';
import { TrashIcon, ChevronRightIcon, ChevronDownIcon, ArrowPathIcon, UploadIcon, DownloadIcon } from '../components/Icons';
import FeedbackForm from '../components/FeedbackForm';
import { useTheme } from '../hooks/useTheme';
import { themes } from '../themes';
import Legal from './Legal';
import { clearApiCache } from '../utils/cacheUtils';
import { DriveStatus } from '../types';
import { GOOGLE_CLIENT_ID } from '../constants';

const SettingsRow: React.FC<{ title: string; subtitle: string; children: React.ReactNode; isDestructive?: boolean; onClick?: () => void, disabled?: boolean }> = ({ title, subtitle, children, isDestructive, onClick, disabled }) => (
    <div 
        className={`flex justify-between items-center p-4 border-b border-bg-secondary last:border-b-0 ${isDestructive ? 'text-red-500' : ''} ${onClick && !disabled ? 'cursor-pointer hover:bg-bg-secondary/50' : ''} ${disabled ? 'opacity-50' : ''}`}
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

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden mb-8">
      <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-accent-gradient">{title}</h2>
        <ChevronDownIcon className={`h-6 w-6 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ enabled, onChange, disabled }) => (
    <button
        onClick={() => onChange(!enabled)}
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

interface SettingsProps {
    driveStatus: DriveStatus;
    onDriveSignIn: () => void;
    onDriveSignOut: () => void;
    onBackupToDrive: () => void;
    onRestoreFromDrive: () => void;
}

const Settings: React.FC<SettingsProps> = ({ driveStatus, onDriveSignIn, onDriveSignOut, onBackupToDrive, onRestoreFromDrive }) => {
  const [activeTheme, setTheme] = useTheme();
  const [activeView, setActiveView] = useState<'settings' | 'legal'>('settings');

  const [notificationSettings, setNotificationSettings] = useState({
    masterEnabled: true,
    newEpisodes: true,
    movieReleases: true,
    friendActivity: false,
    appAnnouncements: false,
    progressReminders: true,
    recommendations: true,
    sounds: true,
    previews: true,
  });
  
  const isDarkMode = activeTheme.base === 'dark';

  const handleThemeToggle = () => {
    // This will toggle between the two "original" themes.
    setTheme(isDarkMode ? 'original-light' : 'original-dark');
  };


  const handleToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => {
        const newState = { ...prev, [setting]: !prev[setting] };
        if (setting === 'masterEnabled' && !newState.masterEnabled) {
            // If master is turned off, turn all others off
            Object.keys(newState).forEach(key => {
                if(key !== 'masterEnabled') {
                    (newState as any)[key] = false;
                }
            });
        }
        return newState;
    });
  };

  const handleExportData = () => {
    try {
        const dataToExport = {
            watching_list: JSON.parse(localStorage.getItem('watching_list') || '[]'),
            plan_to_watch_list: JSON.parse(localStorage.getItem('plan_to_watch_list') || '[]'),
            completed_list: JSON.parse(localStorage.getItem('completed_list') || '[]'),
            watch_progress: JSON.parse(localStorage.getItem('watch_progress') || '{}'),
            history: JSON.parse(localStorage.getItem('history') || '[]'),
            custom_image_paths: JSON.parse(localStorage.getItem('custom_image_paths') || '{}'),
            manual_entries: JSON.parse(localStorage.getItem('manual_entries') || '{}'),
            themeId: localStorage.getItem('themeId') || 'original-dark',
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sceneit_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export data", error);
        alert("An error occurred while exporting your data.");
    }
  };

  const handleClearApiCache = () => {
    if (window.confirm('Are you sure you want to clear the API cache? This may cause the app to load data more slowly temporarily, but it will not affect your lists or progress.')) {
        clearApiCache();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire watch history? This cannot be undone.')) {
        localStorage.removeItem('history');
        window.location.reload();
    }
  };

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all your watch progress? Your lists will remain, but all shows will be marked as unwatched.')) {
        localStorage.removeItem('watch_progress');
        window.location.reload();
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all app settings to their default values? This will not affect your lists or progress.')) {
        localStorage.removeItem('themeId');
        // In the future, other settings keys would be removed here as well.
        window.location.reload();
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account and all data? This action is permanent and cannot be undone.')) {
        localStorage.clear();
        window.location.reload();
    }
  };
  
  if (activeView === 'legal') {
    return <Legal onBack={() => setActiveView('settings')} />;
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
        <CollapsibleSection title="Cloud Sync & Backup" defaultOpen>
            { !driveStatus.isGapiReady ? (
                <div className="p-4 text-text-secondary">Loading Google Drive client...</div>
            ) : driveStatus.isSignedIn && driveStatus.user ? (
                <div>
                    <div className="p-4 flex items-center space-x-4">
                        <img src={driveStatus.user.imageUrl} alt="profile" className="w-12 h-12 rounded-full" />
                        <div>
                            <p className="font-semibold text-text-primary">{driveStatus.user.name}</p>
                            <p className="text-sm text-text-secondary">{driveStatus.user.email}</p>
                        </div>
                    </div>
                    {driveStatus.lastSync && (
                        <div className="px-4 pb-2 text-xs text-text-secondary">
                            Last sync: {new Date(driveStatus.lastSync).toLocaleString()}
                        </div>
                    )}
                    <div className="p-4 border-t border-bg-secondary grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button onClick={onBackupToDrive} disabled={driveStatus.isSyncing} className="flex items-center justify-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125 disabled:opacity-50">
                            <UploadIcon className="h-4 w-4" />
                            <span>{driveStatus.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                        </button>
                        <button onClick={onRestoreFromDrive} disabled={driveStatus.isSyncing} className="flex items-center justify-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125 disabled:opacity-50">
                            <DownloadIcon className="h-4 w-4" />
                            <span>Restore</span>
                        </button>
                        <button onClick={onDriveSignOut} disabled={driveStatus.isSyncing} className="w-full px-3 py-1.5 text-sm rounded-md transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50">
                            Disconnect
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4">
                    <p className="text-text-secondary mb-4">
                        Connect your Google Drive account to back up your watch history, lists, and progress. This also allows you to sync data across devices.
                    </p>
                    <button
                        onClick={onDriveSignIn}
                        disabled={!driveStatus.isGapiReady || GOOGLE_CLIENT_ID.startsWith('YOUR_')}
                        className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-white text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleIcon />
                        <span>Sign in with Google</span>
                    </button>
                    {driveStatus.error && <p className="text-red-500 text-sm mt-2 text-center">{driveStatus.error}</p>}
                    {GOOGLE_CLIENT_ID.startsWith('YOUR_') && <p className="text-yellow-500 text-xs mt-2 text-center">Feature disabled. Admin needs to configure API keys.</p>}
                </div>
            )}
        </CollapsibleSection>

        <CollapsibleSection title="Account Management">
            <SettingsRow title="Edit Profile" subtitle="Username, bio, profile picture.">
                <button disabled className="px-3 py-1.5 text-sm rounded-md bg-bg-secondary/50 text-text-secondary/50 cursor-not-allowed">Edit</button>
            </SettingsRow>
            <SettingsRow title="Security" subtitle="Password, two-factor authentication.">
                <button disabled className="px-3 py-1.5 text-sm rounded-md bg-bg-secondary/50 text-text-secondary/50 cursor-not-allowed">Manage</button>
            </SettingsRow>
            <SettingsRow title="Delete Account" subtitle="Permanently delete your account and all data." isDestructive>
                <button
                    onClick={handleDeleteAccount}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20"
                >
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete</span>
                </button>
            </SettingsRow>
        </CollapsibleSection>
        
        <CollapsibleSection title="Notifications & Preferences">
            <SettingsRow title="Enable All Notifications" subtitle="Master control for all app alerts.">
                <ToggleSwitch enabled={notificationSettings.masterEnabled} onChange={() => handleToggle('masterEnabled')} />
            </SettingsRow>
             <SettingsRow title="New Episode / Season" subtitle="Alerts when new content for your shows is available." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.newEpisodes} onChange={() => handleToggle('newEpisodes')} disabled={!notificationSettings.masterEnabled}/>
            </SettingsRow>
             <SettingsRow title="Movie Releases & Updates" subtitle="News about movies on your lists." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.movieReleases} onChange={() => handleToggle('movieReleases')} disabled={!notificationSettings.masterEnabled}/>
            </SettingsRow>
             <SettingsRow title="Friend Activity" subtitle="See what your friends are watching (coming soon)." disabled>
                <ToggleSwitch enabled={notificationSettings.friendActivity} onChange={() => handleToggle('friendActivity')} disabled/>
            </SettingsRow>
            <SettingsRow title="App Announcements" subtitle="Receive updates and news about SceneIt." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.appAnnouncements} onChange={() => handleToggle('appAnnouncements')} disabled={!notificationSettings.masterEnabled}/>
            </SettingsRow>
             <SettingsRow title="Progress Reminders" subtitle="Get nudged to finish what you started (coming soon)." disabled>
                <ToggleSwitch enabled={notificationSettings.progressReminders} onChange={() => handleToggle('progressReminders')} disabled/>
            </SettingsRow>
             <SettingsRow title="Recommendations" subtitle="Personalized suggestions based on your history (coming soon)." disabled>
                <ToggleSwitch enabled={notificationSettings.recommendations} onChange={() => handleToggle('recommendations')} disabled/>
            </SettingsRow>
             <SettingsRow title="Notification Sounds" subtitle="Play a sound for new notifications." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.sounds} onChange={() => handleToggle('sounds')} disabled={!notificationSettings.masterEnabled}/>
            </SettingsRow>
            <SettingsRow title="Notification Previews" subtitle="Show details in the notification." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.previews} onChange={() => handleToggle('previews')} disabled={!notificationSettings.masterEnabled} />
            </SettingsRow>
             <SettingsRow title="Do Not Disturb" subtitle="Set a schedule to silence alerts (coming soon)." disabled>
                <button disabled className="px-3 py-1.5 text-sm rounded-md bg-bg-secondary/50 text-text-secondary/50 cursor-not-allowed">Set Schedule</button>
            </SettingsRow>
        </CollapsibleSection>
      
        <CollapsibleSection title="Theme Customization">
            <SettingsRow title="Dark Mode" subtitle="Toggle between light and dark base themes.">
                <ToggleSwitch enabled={isDarkMode} onChange={handleThemeToggle} />
            </SettingsRow>
            <div className="p-4 border-t border-bg-secondary">
                <p className="text-text-secondary mb-4">Or, select a specific theme from the palette below.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {themes.map(theme => (
                        <div key={theme.id} onClick={() => setTheme(theme.id)} className="cursor-pointer group">
                            <div 
                                style={{ backgroundImage: theme.colors.bgGradient }}
                                className={`h-20 rounded-lg border-2 transition-all group-hover:scale-105 ${activeTheme.id === theme.id ? 'border-primary-accent' : 'border-transparent'}`}
                            >
                            </div>
                            <p className={`text-center text-sm mt-2 font-semibold transition-colors ${activeTheme.id === theme.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                                {theme.name}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </CollapsibleSection>

        <CollapsibleSection title="Privacy & Data">
            <SettingsRow title="Export All Data" subtitle="Download a JSON file of all your data.">
                <button onClick={handleExportData} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125">
                    <span>Export</span>
                </button>
            </SettingsRow>
            <SettingsRow title="Clear API Cache" subtitle="Frees up storage by removing temporary movie & show data.">
                <button onClick={handleClearApiCache} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125">
                    <TrashIcon className="h-4 w-4" />
                    <span>Clear</span>
                </button>
            </SettingsRow>
            <SettingsRow title="Clear Watch History" subtitle="Removes all entries from your history." isDestructive>
                <button onClick={handleClearHistory} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20">
                    <TrashIcon className="h-4 w-4" />
                    <span>Clear</span>
                </button>
            </SettingsRow>
            <SettingsRow title="Reset All Progress" subtitle="Marks all episodes as unwatched." isDestructive>
                <button onClick={handleResetProgress} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20">
                    <TrashIcon className="h-4 w-4" />
                    <span>Reset</span>
                </button>
            </SettingsRow>
            <SettingsRow title="Reset App Settings" subtitle="Revert theme and preferences to default." isDestructive>
                <button onClick={handleResetSettings} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Reset</span>
                </button>
            </SettingsRow>
        </CollapsibleSection>
      
        <CollapsibleSection title="Legal">
            <SettingsRow 
                title="Terms of Service & Privacy" 
                subtitle="View the app's policies and copyright information."
                onClick={() => setActiveView('legal')}
            >
                <ChevronRightIcon className="h-6 w-6 text-text-secondary" />
            </SettingsRow>
        </CollapsibleSection>

        <CollapsibleSection title="Support & Feedback">
            <FeedbackForm />
        </CollapsibleSection>
    </div>
  );
};

export default Settings;