
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
  isHoliday: boolean;
  holidayName: string | null;
}

const Header: React.FC<HeaderProps> = ({ currentUser, profilePictureUrl, onAuthClick, onGoToProfile, onSelectShow, onGoHome, onMarkShowAsWatched, query, onQueryChange, isOnSearchScreen, isHoliday, holidayName }) => {
  const iconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRUYwOEEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGREUwNDciLz48L2xpbmVhckdyYWRpZW50PjxmaWx0ZXIgaWQ9Imdsb3ciPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjMiIHJlc3VsdD0iYmx1ciIvPjxmZU1lcmdlPjxmZU1lcmdlTm9kZSBpbj0iYmx1ciIvPjxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPjwvZmVNZXJnZT48L2ZpbHRlcj48L2RlZnM+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgcng9IjI4IiBmaWxsPSIjMTExODI3Ii8+PHJlY3QgeD0iMTQiIHk9IjE0IiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjI0IiBmaWxsPSIjMDAwMDAwIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzIsIDMyKSBzY2FsZSgwLjgpIj48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHJ4PSI0IiBmaWx0ZXI9InVybCgjZ2xvdykiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNncmFkMSkiIHN0cm9rZS13aWR0aD0iNiIgb3BhY2l0eT0iMC41Ii8+PHJlY3QgeD0iMTEyIiB5PSIxMiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNCIgZmlsdGVyPSJ1cmwoI2dsb3cpIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjZ3JhZDEpIiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBkPSJNMzQgMjggTDUwIDQwIEwzNCA1MiBaIiBmaWxsPSIjRkZGMThBIi8+PC9nPjwvc3ZnPg==";
  return (
    <header className="sticky top-0 z-30 py-2 px-6 bg-backdrop backdrop-blur-md shadow-lg">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <div 
          onClick={onGoHome}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer"
        >
            <img src={iconDataUri} alt="cinemontauge Logo" className="h-8 w-8" />
            <h1 className="text-xs font-bold bg-accent-gradient bg-clip-text text-transparent -mt-1 uppercase tracking-tighter">cinemontauge</h1>
        </div>

        <div className="flex-1 flex justify-center items-center">
            <div className="min-w-0 w-72 md:w-96">
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
        </div>
        <div className="w-48 flex items-center justify-end">
          {currentUser ? (
            <button
              onClick={onGoToProfile}
              className="flex items-center space-x-2 rounded-full p-1 pr-4 hover:bg-bg-secondary transition-colors group"
              title="Go to Profile"
            >
              <img
                src={profilePictureUrl || `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#64748b"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>')}`}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover bg-bg-secondary border-2 border-transparent group-hover:border-primary-accent transition-colors"
              />
              <span className="text-sm font-semibold text-text-primary truncate max-w-[100px]">{currentUser.username}</span>
            </button>
          ) : (
            <button
              onClick={onAuthClick}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-accent-gradient text-on-accent hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
