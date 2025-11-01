import React, { useState, useEffect } from 'react';
import { TrashIcon, ChevronRightIcon, ArrowPathIcon, UploadIcon, DownloadIcon } from '../components/Icons';
import FeedbackForm from '../components/FeedbackForm';
import Legal from './Legal';
import { NotificationSettings, Theme, WatchProgress, HistoryItem, EpisodeRatings, FavoriteEpisodes, TrackedItem, PrivacySettings, UserData, ProfileTheme } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ThemeSettings from '../components/ThemeSettings';
import ResetPasswordModal from '../components/ResetPasswordModal';
import TimezoneSettings from '../components/TimezoneSettings';

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
}

const Settings: React.FC<SettingsProps> = (props) => {
  const { onFeedbackSubmit, notificationSettings, setNotificationSettings, privacySettings, setPrivacySettings, setHistory, setWatchProgress, setEpisodeRatings, setFavoriteEpisodes, setTheme, setCustomThemes, onLogout, onUpdatePassword, onForgotPasswordRequest, onForgotPasswordReset, currentUser, setCompleted, userData, timezone, setTimezone, onRemoveDuplicateHistory, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled, holidayAnimationsEnabled, setHolidayAnimationsEnabled, profileTheme, setProfileTheme, textSize, setTextSize, userLevel, timeFormat, setTimeFormat } = props;
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
            return {
                ...prev,
                masterEnabled: false,
                newEpisodes: false,
                movieReleases: false,
                sounds: false,
                newFollowers: false,
                listLikes: false,
                appUpdates: false,
                importSyncCompleted: false,
            };
        }
         if (setting === 'masterEnabled' && newState.masterEnabled) {
            return {
                ...prev,
                masterEnabled: true,
                newEpisodes: true,
                movieReleases: true,
                sounds: true,
                newFollowers: true,
                listLikes: true,
                appUpdates: true,
                importSyncCompleted: true,
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
                    dataToExport[key