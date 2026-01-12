
import React from 'react';
import SearchBar from './SearchBar';
import { TmdbMedia } from '../types';

interface User {
  id: string;
  username: string;
  email: string;
}

interface HeaderProps {
  currentUser: User | null;
  profilePictureUrl: string | null;
  onAuthClick: () => void;
  onGoToProfile: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onGoHome: () => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  isOnSearchScreen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentUser, profilePictureUrl, onAuthClick, onGoToProfile, onSelectShow, onGoHome, onMarkShowAsWatched, query, onQueryChange, isOnSearchScreen }) => {
  const bannerIconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjAiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlZjQ0NDQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM3ZjFkMWQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9IiMwMDAiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMCwgMTApIj48cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjYwIiByeD0iOCIgZmlsbD0idXJsKCNnKSIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI0MCIgcng9IjQiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNyIvPjxwYXRoIGQ9Ik04OCAyNWwyNCA3LjUtMjQgNy41VjI1eiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik00IDRoOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bS0xNzYgNDhoOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6bTIwIDBIOHY0SDR6IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjUiLz48L2c+PC9zdmc+";
  
  return (
    <header className="sticky top-0 z-30 py-2 px-6 bg-backdrop backdrop-blur-md shadow-lg border-b border-white/5">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <div 
          onClick={onGoHome}
          className="flex flex-col items-center cursor-pointer group flex-shrink-0"
        >
            <img src={bannerIconDataUri} alt="CineMontauge Banner" className="h-8 w-auto transition-transform duration-500 group-hover:scale-105" />
            <h1 className="text-[10px] font-black text-text-primary uppercase tracking-[0.3em] mt-1 group-hover:text-primary-accent transition-colors">CineMontauge</h1>
        </div>

        <div className="flex-1 flex justify-center items-center max-w-xl">
            {!isOnSearchScreen && (
                <SearchBar 
                    onSelectResult={onSelectShow} 
                    onMarkShowAsWatched={onMarkShowAsWatched} 
                    value={query} 
                    onChange={onQueryChange}
                    dropdownWider
                />
            )}
        </div>
        
        <div className="flex items-center justify-end w-32 md:w-48 flex-shrink-0">
          {currentUser ? (
            <button
              onClick={onGoToProfile}
              className="flex items-center space-x-2 rounded-full p-1 transition-all hover:bg-white/5 group"
            >
              <img
                src={profilePictureUrl || `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#64748b"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>')}`}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover bg-bg-secondary border border-transparent group-hover:border-primary-accent"
              />
              <span className="hidden md:block text-[10px] font-bold text-text-primary uppercase tracking-widest truncate max-w-[80px]">{currentUser.username}</span>
            </button>
          ) : (
            <button onClick={onAuthClick} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full bg-accent-gradient text-on-accent hover:opacity-90">Login</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
