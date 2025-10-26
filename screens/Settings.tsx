import React, { useState, useEffect } from 'react';
import { TrashIcon, ChevronRightIcon, ArrowPathIcon, UploadIcon, DownloadIcon, PlusIcon, StarIcon } from '../components/Icons';
import FeedbackForm from '../components/FeedbackForm';
import { useTheme } from '../hooks/useTheme';
import { themes } from '../themes';
import Legal from './Legal';
import { clearApiCache } from '../utils/cacheUtils';
import { DriveStatus, Theme, NotificationSettings } from '../types';
import { GOOGLE_CLIENT_ID } from '../constants';
import CustomThemeModal from '../components/CustomThemeModal';
import { useLocalStorage } from '../hooks/useLocalStorage';

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

interface SettingsProps {
    driveStatus: DriveStatus;
    onDriveSignIn: () => void;
    onDriveSignOut: () => void;
    onBackupToDrive: () => void;
    onRestoreFromDrive: () => void;
    isVip: boolean;
    notificationSettings: NotificationSettings;
    setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

const Settings: React.FC<SettingsProps> = (props) => {
  const { driveStatus, onDriveSignIn, onDriveSignOut, onBackupToDrive, onRestoreFromDrive, isVip, notificationSettings, setNotificationSettings } = props;
  const [activeTheme, setTheme] = useTheme();
  const [activeView, setActiveView] = useState<'settings' | 'legal'>('settings');
  const [isCustomThemeModalOpen, setIsCustomThemeModalOpen] = useState(false);
  const [customThemes, setCustomThemes] = useLocalStorage<Theme[]>('customThemes', []);
  const [autoBackupEnabled, setAutoBackupEnabled] = useLocalStorage('autoBackupEnabled', false);
  const [lastLocalBackup, setLastLocalBackup] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<'dark' | 'light' | 'all'>('all');

  useEffect(() => {
    if (localStorage.getItem('sceneit_import_success') === 'true') {
      alert('Data imported successfully!');
      localStorage.removeItem('sceneit_import_success');
    }
    setLastLocalBackup(localStorage.getItem('auto_backup_last_timestamp'));
  }, []);

  const handleSaveCustomTheme = (newTheme: Theme) => {
    setCustomThemes(prev => [...prev, newTheme]);
    setTheme(newTheme.id); // Optionally switch to the new theme immediately
  };

  const handleDeleteCustomTheme = (e: React.MouseEvent, themeId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this theme?")) {
        setCustomThemes(prev => prev.filter(t => t.id !== themeId));
        if (activeTheme.id === themeId) {
            setTheme('original-dark'); // Switch to a default theme if the active one is deleted
        }
    }
  };


  const handleToggleNotification = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => {
        const newState = { ...prev, [setting]: !prev[setting] };
        if (setting === 'masterEnabled' && !newState.masterEnabled) {
            // When master is turned off, disable all others
            return {
                masterEnabled: false,
                newEpisodes: false,
                movieReleases: false,
                appAnnouncements: false,
                sounds: false,
            };
        }
         if (setting === 'masterEnabled' && newState.masterEnabled) {
            // When master is turned on, restore previous settings (or enable all)
            return {
                masterEnabled: true,
                newEpisodes: true,
                movieReleases: true,
                appAnnouncements: true,
                sounds: true,
            };
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
                    // Try to parse as JSON, if it fails, it's a plain string
                    dataToExport[key] = JSON.parse(item);
                } catch (e) {
                    dataToExport[key] = item;
                }
            }
        });

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

  const handleImportData = (source: 'file' | 'local') => {
    const processData = (dataText: string | null) => {
        if (!dataText) {
            alert("No backup data found.");
            return;
        }
        try {
            const data = JSON.parse(dataText);

            if (!data.watching_list && !data.history && !data.themeId) {
                alert('Error: Invalid or corrupted backup file.');
                return;
            }

            if (window.confirm("This will overwrite all current data in the app with the contents of the backup. This action cannot be undone. Are you sure?")) {
                localStorage.clear();
                Object.keys(data).forEach(key => {
                    const value = data[key];
                    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                });
                
                localStorage.setItem('sceneit_import_success', 'true');
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to import data", error);
            alert("An error occurred while importing the data. The file might be corrupted.");
        }
    };

    if (source === 'file') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => processData(e.target?.result as string);
            reader.readAsText(file);
        };
        input.click();
    } else if (source === 'local') {
        processData(localStorage.getItem('sceneit_local_backup'));
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
        localStorage.removeItem('customThemes');
        localStorage.removeItem('notification_settings');
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

  const filteredBuiltInThemes = themes.filter(theme => themeFilter === 'all' || theme.base === themeFilter);
  const filteredCustomThemes = customThemes.filter(theme => themeFilter === 'all' || theme.base === themeFilter);


  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
        <CustomThemeModal 
            isOpen={isCustomThemeModalOpen}
            onClose={() => setIsCustomThemeModalOpen(false)}
            onSave={handleSaveCustomTheme}
        />
        <SettingsCard title="Cloud Sync & Backup">
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
                    <div className="p-4 border-t border-bg-secondary/50 grid grid-cols-1 sm:grid-cols-3 gap-2">
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
        </SettingsCard>

        <SettingsCard title="Account Management">
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
        </SettingsCard>
        
        <SettingsCard title="Notifications & Preferences">
            <SettingsRow title="Enable All Notifications" subtitle="Master control for all app alerts.">
                <ToggleSwitch enabled={notificationSettings.masterEnabled} onChange={() => handleToggleNotification('masterEnabled')} />
            </SettingsRow>
             <SettingsRow title="New Episode / Season" subtitle="Alerts for new content you're tracking." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.newEpisodes} onChange={() => handleToggleNotification('newEpisodes')} disabled={!notificationSettings.masterEnabled}/>
            </SettingsRow>
             <SettingsRow title="Movie Releases & Updates" subtitle="News about movies on your lists (e.g., sequels)." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.movieReleases} onChange={() => handleToggleNotification('movieReleases')} disabled={!notificationSettings.masterEnabled}/>
            </SettingsRow>
            <SettingsRow title="App Announcements" subtitle="Receive updates and news about SceneIt." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.appAnnouncements} onChange={() => handleToggleNotification('appAnnouncements')} disabled={!notificationSettings.masterEnabled}/>
            </SettingsRow>
            <SettingsRow title="Notification Sounds" subtitle="Play a sound for new notifications." disabled={!notificationSettings.masterEnabled}>
                <ToggleSwitch enabled={notificationSettings.sounds} onChange={() => handleToggleNotification('sounds')} disabled={!notificationSettings.masterEnabled}/>
            </SettingsRow>
        </SettingsCard>
      
        <SettingsCard title="Theme Customization">
            <div className="p-4 border-b border-bg-secondary/50">
                <p className="text-text-secondary mb-3 font-semibold">Filter Themes</p>
                <div className="flex p-1 bg-bg-secondary rounded-full">
                    <button onClick={() => setThemeFilter('dark')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${themeFilter === 'dark' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>Dark</button>
                    <button onClick={() => setThemeFilter('light')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${themeFilter === 'light' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>Light</button>
                    <button onClick={() => setThemeFilter('all')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${themeFilter === 'all' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>All</button>
                </div>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredBuiltInThemes.map(theme => (
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
                    <div onClick={() => isVip && setIsCustomThemeModalOpen(true)} className={`group ${isVip ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <div className={`h-20 rounded-lg border-2 border-dashed  flex items-center justify-center transition-all ${isVip ? 'border-text-secondary/50 bg-bg-secondary/30 group-hover:border-primary-accent group-hover:bg-bg-secondary/50' : 'border-text-secondary/20 bg-bg-secondary/10'}`}>
                            {isVip ? <PlusIcon className="w-8 h-8 text-text-secondary/80 group-hover:text-primary-accent transition-colors" /> : <StarIcon filled className="w-8 h-8 text-yellow-500/50" />}
                        </div>
                        <p className={`text-center text-sm mt-2 font-semibold  transition-colors ${isVip ? 'text-text-secondary group-hover:text-text-primary' : 'text-text-secondary/50'}`}>
                            {isVip ? 'Create New' : 'VIP Feature'}
                        </p>
                    </div>
                </div>
                {!isVip && <p className="text-center text-xs text-yellow-400 mt-4">Unlock custom themes by earning VIP passes from hard achievements!</p>}

                {filteredCustomThemes.length > 0 && (
                    <div className="mt-8 pt-4 border-t border-bg-secondary/50">
                        <p className="text-text-secondary mb-4 font-semibold">My Themes</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                             {filteredCustomThemes.map(theme => (
                                <div key={theme.id} onClick={() => setTheme(theme.id)} className="cursor-pointer group relative">
                                    <button onClick={(e) => handleDeleteCustomTheme(e, theme.id)} className="absolute -top-2 -right-2 z-10 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">
                                        <TrashIcon className="w-3 h-3"/>
                                    </button>
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
                )}
            </div>
        </SettingsCard>

        <SettingsCard title="Privacy & Data">
            <SettingsRow title="Download Backup" subtitle="Save a JSON file of all your data to your device.">
                <button onClick={handleExportData} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125">
                    <DownloadIcon className="h-4 w-4" />
                    <span>Download</span>
                </button>
            </SettingsRow>
             <SettingsRow title="Restore from File" subtitle="Upload a backup file to restore your data.">
                <button onClick={() => handleImportData('file')} className="flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125">
                    <UploadIcon className="h-4 w-4" />
                    <span>Restore</span>
                </button>
            </SettingsRow>
            <SettingsRow title="Automatic Local Backup" subtitle="Automatically back up data to this device every 24 hours.">
                <ToggleSwitch enabled={autoBackupEnabled} onChange={setAutoBackupEnabled} />
            </SettingsRow>
             <div className="px-4 pb-4 border-b border-bg-secondary/50">
                <button 
                    onClick={() => handleImportData('local')} 
                    disabled={!lastLocalBackup}
                    className="w-full text-center px-3 py-1.5 text-sm rounded-md transition-colors bg-bg-secondary text-text-primary hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Restore from Local Backup
                </button>
                {lastLocalBackup && <p className="text-xs text-text-secondary text-center mt-2">Last backup: {new Date(lastLocalBackup).toLocaleString()}</p>}
            </div>

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
        </SettingsCard>
      
        <SettingsCard title="Legal">
            <SettingsRow 
                title="Terms of Service & Privacy" 
                subtitle="View the app's policies and copyright information."
                onClick={() => setActiveView('legal')}
            >
                <ChevronRightIcon className="h-6 w-6 text-text-secondary" />
            </SettingsRow>
        </SettingsCard>

        <SettingsCard title="Support & Feedback">
            <FeedbackForm />
        </SettingsCard>
    </div>
  );
};

export default Settings;