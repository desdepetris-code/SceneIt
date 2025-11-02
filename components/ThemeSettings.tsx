import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { themes as builtInThemes, holidayThemes } from '../themes';
import { Theme, ProfileTheme } from '../types';
import { PlusIcon, TrashIcon } from './Icons';
import CustomThemeModal from './CustomThemeModal';
import { getNextHoliday } from '../hooks/useTheme';
import ProfilePersonalizationModal from './ProfilePersonalizationModal';

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

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ enabled, onChange, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${enabled ? 'bg-primary-accent' : 'bg-bg-secondary'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${enabled ? 'translate-x-5' : ''}`}/>
    </button>
);

interface ThemeSettingsProps {
    customThemes: Theme[];
    setCustomThemes: React.Dispatch<React.SetStateAction<Theme[]>>;
    autoHolidayThemesEnabled: boolean;
    setAutoHolidayThemesEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    holidayAnimationsEnabled: boolean;
    setHolidayAnimationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    profileTheme: ProfileTheme | null;
    setProfileTheme: React.Dispatch<React.SetStateAction<ProfileTheme | null>>;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ customThemes, setCustomThemes, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled, holidayAnimationsEnabled, setHolidayAnimationsEnabled, profileTheme, setProfileTheme }) => {
    const [activeTheme, setTheme] = useTheme(customThemes, autoHolidayThemesEnabled);
    const [isCustomThemeModalOpen, setIsCustomThemeModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dark' | 'light' | 'custom' | 'holiday'>('dark');
    
    const nextHoliday = getNextHoliday(new Date());

    const handleSaveCustomTheme = (newTheme: Theme) => {
        setCustomThemes(prev => [...prev, newTheme]);
        setTheme(newTheme.id);
    };

    const handleDeleteCustomTheme = (e: React.MouseEvent, themeId: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this theme?")) {
            setCustomThemes(prev => prev.filter(t => t.id !== themeId));
            if (activeTheme.id === themeId) {
                setTheme('original-dark');
            }
        }
    };

    const darkThemes = builtInThemes.filter(theme => theme.base === 'dark');
    const lightThemes = builtInThemes.filter(theme => theme.base === 'light');

    const renderThemes = () => {
        let themesToRender: Theme[] = [];
        if (activeTab === 'dark') themesToRender = darkThemes;
        if (activeTab === 'light') themesToRender = lightThemes;
        if (activeTab === 'holiday') themesToRender = holidayThemes;
        
        if (activeTab === 'custom') {
            return (
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div onClick={() => setIsCustomThemeModalOpen(true)} className="group cursor-pointer">
                        <div className="h-20 rounded-lg border-2 border-dashed border-text-secondary/50 bg-bg-secondary/30 flex items-center justify-center transition-all group-hover:border-primary-accent group-hover:bg-bg-secondary/50">
                            <PlusIcon className="w-8 h-8 text-text-secondary/80 group-hover:text-primary-accent transition-colors" />
                        </div>
                        <p className="text-center text-sm mt-2 font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                            Create New
                        </p>
                    </div>
                    {customThemes.map(theme => {
                         const borderColor = activeTheme.id === theme.id 
                            ? 'border-primary-accent' 
                            : theme.base === 'dark' 
                                ? 'border-white/10' 
                                : 'border-black/10';
                        return (
                        <div key={theme.id} onClick={() => setTheme(theme.id)} className="cursor-pointer group relative">
                            <button onClick={(e) => handleDeleteCustomTheme(e, theme.id)} className="absolute -top-2 -right-2 z-10 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">
                                <TrashIcon className="w-3 h-3"/>
                            </button>
                            <div 
                                style={{ 
                                    backgroundImage: theme.colors.bgGradient,
                                    backgroundSize: theme.colors.patternBgSize,
                                    backgroundColor: theme.colors.patternBgColor,
                                    backgroundPosition: theme.colors.patternBgPosition
                                }}
                                className={`h-20 rounded-lg border-2 transition-all group-hover:scale-105 ${borderColor}`}
                            >
                            </div>
                            <p className={`text-center text-sm mt-2 font-semibold transition-colors ${activeTheme.id === theme.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                                {theme.name}
                            </p>
                        </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {themesToRender.map(theme => {
                    const borderColor = activeTheme.id === theme.id 
                        ? 'border-primary-accent' 
                        : theme.base === 'dark' 
                            ? 'border-white/10' 
                            : 'border-black/10';
                    return (
                        <div key={theme.id} onClick={() => setTheme(theme.id)} className="cursor-pointer group">
                            <div 
                                style={{ backgroundImage: theme.colors.bgGradient }}
                                className={`h-20 rounded-lg border-2 transition-all group-hover:scale-105 ${borderColor}`}
                            >
                            </div>
                            <p className={`text-center text-sm mt-2 font-semibold transition-colors ${activeTheme.id === theme.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                                {theme.name}
                            </p>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <CustomThemeModal 
                isOpen={isCustomThemeModalOpen}
                onClose={() => setIsCustomThemeModalOpen(false)}
                onSave={handleSaveCustomTheme}
            />
            <ProfilePersonalizationModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={setProfileTheme}
                currentTheme={profileTheme}
            />
            <SettingsCard title="Theme Customization">
                <div className="p-4">
                    <button onClick={() => setIsProfileModalOpen(true)} className="w-full text-center p-3 text-sm rounded-md font-semibold transition-colors bg-accent-gradient text-on-accent hover:opacity-90">
                        Personalize Profile
                    </button>
                </div>
                <div className="p-4 border-t border-b border-bg-secondary/50">
                    <p className="text-text-secondary mb-3 font-semibold">Select an App Theme</p>
                    <div className="flex p-1 bg-bg-secondary rounded-full">
                        <button onClick={() => setActiveTab('dark')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${activeTab === 'dark' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>Dark</button>
                        <button onClick={() => setActiveTab('light')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${activeTab === 'light' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>Light</button>
                        <button onClick={() => setActiveTab('holiday')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${activeTab === 'holiday' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>Holiday</button>
                        <button onClick={() => setActiveTab('custom')} className={`w-full py-1.5 text-sm font-semibold rounded-full transition-all ${activeTab === 'custom' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>Custom</button>
                    </div>
                </div>
                <div className="p-4">
                    {renderThemes()}
                </div>
                <div className="border-t border-bg-secondary/50">
                    <SettingsRow title="Auto Apply Holiday Themes" subtitle="Switch to holiday themes automatically.">
                        <ToggleSwitch enabled={autoHolidayThemesEnabled} onChange={setAutoHolidayThemesEnabled} />
                    </SettingsRow>
                    <SettingsRow title="Holiday Theme Animations" subtitle="Enable or disable animated holiday decorations.">
                        <ToggleSwitch enabled={holidayAnimationsEnabled} onChange={setHolidayAnimationsEnabled} />
                    </SettingsRow>
                    {nextHoliday && (
                        <div className="p-4 text-sm text-text-secondary">
                            Upcoming Holiday: <strong className="text-text-primary">{nextHoliday.name}</strong> on {nextHoliday.date.toLocaleDateString()}. Theme activates {nextHoliday.startDate.toLocaleDateString()}.
                        </div>
                    )}
                </div>
            </SettingsCard>
        </>
    );
};

export default ThemeSettings;