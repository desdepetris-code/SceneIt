import React, { useMemo, useState } from 'react';
import { UserData, DriveStatus, HistoryItem, TrackedItem } from '../types';
import { FilmIcon, TvIcon, ClockIcon, FireIcon, UserIcon, BookOpenIcon, ViewGridIcon, CloudArrowUpIcon, BadgeIcon, CogIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';
import TrackedListItem from '../components/TrackedListItem';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
import ImportsScreen from './ImportsScreen';
import AchievementsScreen from './AchievementsScreen';
import Settings from './Settings';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-bg-secondary p-4 rounded-lg flex items-center space-x-4">
        <div className="text-primary-accent">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient mb-4">{title}</h2>
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
}

type ProfileTab = 'overview' | 'history' | 'progress' | 'imports' | 'achievements' | 'settings';

const Profile: React.FC<ProfileProps> = ({ userData, onSelectShow, driveStatus, onDriveSignIn, onDriveSignOut, onBackupToDrive, onRestoreFromDrive, onImportCompleted }) => {
    const { watching, planToWatch, completed, history } = userData;
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
    
    const calculatedStats = useCalculatedStats(userData);
  
    const topStats = useMemo(() => {
        const {
            showsCompleted,
            moviesCompleted,
            longestStreak,
            totalItemsOnLists,
            watchedGenreCount,
            journalCount
        } = calculatedStats;
        
        return { 
            showsCompleted, 
            moviesCompleted, 
            longestStreak, 
            totalItems: totalItemsOnLists,
            watchedGenreCount,
            journalCount,
        };
    }, [calculatedStats]);
    
    const tabs: {id: ProfileTab, label: string, icon: React.ReactNode}[] = [
        { id: 'overview', label: 'Overview', icon: <ViewGridIcon className="w-5 h-5 mr-2" /> },
        { id: 'history', label: 'History', icon: <ClockIcon className="w-5 h-5 mr-2" /> },
        { id: 'progress', label: 'Progress', icon: <BookOpenIcon className="w-5 h-5 mr-2" /> },
        { id: 'imports', label: 'Imports', icon: <CloudArrowUpIcon className="w-5 h-5 mr-2" /> },
        { id: 'achievements', label: 'Achievements', icon: <BadgeIcon className="w-5 h-5 mr-2" /> },
        { id: 'settings', label: 'Settings', icon: <CogIcon className="w-5 h-5 mr-2" /> },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <section className="mb-8">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatCard title="Shows Completed" value={topStats.showsCompleted} icon={<TvIcon className="w-8 h-8" />} />
                            <StatCard title="Movies Completed" value={topStats.moviesCompleted} icon={<FilmIcon className="w-8 h-8"/>} />
                            <StatCard title="Longest Streak" value={`${topStats.longestStreak} days`} icon={<FireIcon className="w-8 h-8"/>} />
                            <StatCard title="Total List Items" value={topStats.totalItems} icon={<BookOpenIcon className="w-8 h-8"/>} />
                            <StatCard title="Genres Explored" value={topStats.watchedGenreCount} icon={<ViewGridIcon className="w-8 h-8"/>} />
                            <StatCard title="Journal Entries" value={topStats.journalCount} icon={<UserIcon className="w-8 h-8"/>} />
                        </div>
                    </section>
                );
            case 'history':
                return (
                     <section>
                        <SectionHeader title="Watch History" />
                        <div className="bg-card-gradient rounded-lg shadow-md">
                            {history.length > 0 ? (
                                <div className="space-y-1">
                                    {history.filter(item => item.timestamp && !isNaN(new Date(item.timestamp).getTime())).map(item => (
                                        <div key={item.timestamp} onClick={() => onSelectShow(item.id, item.media_type)} className="flex items-center p-3 border-b border-bg-secondary last:border-b-0 cursor-pointer hover:bg-bg-secondary/50 rounded-lg">
                                            <img src={getImageUrl(item.poster_path, 'w92')} alt={item.title} className="w-10 h-15 rounded-md"/>
                                            <div className="ml-4 flex-grow">
                                                <p className="font-semibold text-text-primary">{item.title}</p>
                                                <p className="text-sm text-text-secondary">{item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}`: 'Movie'}</p>
                                            </div>
                                            <p className="text-sm text-text-secondary flex-shrink-0">{new Date(String(item.timestamp)).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="p-4 text-text-secondary">No watch history yet.</p>}
                        </div>
                    </section>
                );
            case 'progress':
                return (
                    <>
                        <section className="mb-8">
                            <SectionHeader title="Watching" />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {watching.length > 0 ? watching.map(item => (
                                    <TrackedListItem key={item.id} item={item} onSelect={onSelectShow}/>
                                )) : <p className="text-text-secondary">Not watching anything right now.</p>}
                            </div>
                        </section>
                        <section className="mb-8">
                            <SectionHeader title="Plan to Watch" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {planToWatch.length > 0 ? planToWatch.map(item => (
                                    <TrackedListItem key={item.id} item={item} onSelect={onSelectShow}/>
                                )) : <p className="text-text-secondary">Your plan to watch list is empty.</p>}
                            </div>
                        </section>
                         <section>
                            <SectionHeader title="Completed" />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {completed.length > 0 ? completed.map(item => (
                                    <TrackedListItem key={item.id} item={item} onSelect={onSelectShow}/>
                                )) : <p className="text-text-secondary">You haven't completed any items yet.</p>}
                            </div>
                        </section>
                    </>
                );
            case 'imports':
                return <ImportsScreen onImportCompleted={onImportCompleted} />;
            case 'achievements':
                return <AchievementsScreen userData={userData} />;
            case 'settings':
                return <Settings 
                          driveStatus={driveStatus}
                          onDriveSignIn={onDriveSignIn}
                          onDriveSignOut={onDriveSignOut}
                          onBackupToDrive={onBackupToDrive}
                          onRestoreFromDrive={onRestoreFromDrive}
                       />;
        }
    }


    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
            <header className="flex items-center space-x-4 mb-6 p-4 bg-card-gradient rounded-lg">
                <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">SceneIt User</h1>
                    <p className="text-text-secondary text-sm">Lover of great stories. Critic of bad endings.</p>
                </div>
            </header>
            
            <div className="mb-8">
                <div className="flex space-x-2 overflow-x-auto p-1 bg-bg-secondary rounded-full hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex-shrink-0 ${
                            activeTab === tab.id ? 'bg-accent-gradient text-white shadow-lg' : 'text-text-secondary'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            {renderContent()}
        </div>
    );
};

export default Profile;