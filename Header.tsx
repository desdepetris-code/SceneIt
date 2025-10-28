import React from 'react';
import SearchBar from './SearchBar';
import { TmdbMedia } from './types';

interface User {
  id: string;
  username: string;
  email: string;
}

interface HeaderProps {
  currentUser: User | null;
  onAuthClick: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onGoHome: () => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onAuthClick, onSelectShow, onGoHome, onMarkShowAsWatched, query, onQueryChange }) => {
  const iconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJjbGFwcGVyLXRvcC1ncmFkIiB4MT0iMC41IiB5MT0iMCIgeDI9IjAuNSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRUYwOEEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGREUwNDciLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iY2xhcHBlci1ib2R5LWdyYWQiIHgxPSIwLjUiIHkxPSIwIiB4Mj0iMC41IiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZFRjlDMyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0ZFRjA4QSIvPjwvbGluZWFyR3JhZGllbnQ+PGZpbHRlciBpZD0iZ2xvdyI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMi41IiByZXN1bHQ9ImNvbG9yZWRCbHVyIi8+PGZlTWVyZ2U+PGZlTWVyZ2VOb2RlIGluPSJjb2xvcmVkQmx1ciIvPjxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPjwvZmVNZXJnZT48L2ZpbHRlcj48L2RlZnM+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgcng9IjI0IiByeT0iMjQiIGZpbGw9IiMxMTE4MjciLz48cmVjdCB4PSIxNCIgeT0iMTQiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iMjAiIHJ5PSIyMCIgZmlsbD0iIzAwMDAwMCIvPjxwYXRoIGQ9Ik0zMCAyNSBMMzIgMjAgTDM0IDI1IEwzOSAyNyBMMzQgMjkgTDMyIDM0IEwzMCAyOSBMMjUgMjcgWiIgZmlsbD0iI0ZFRjA4QSIgb3BhY2l0eT0iMC44IiBmaWx0ZXI9InVybCgjZ2xvdykiLz48cGF0aCBkPSJNOTggNDAgTDEwMCAzNSBMMTAyIDQwIEwxMDcgNDIgTDEwMiA0NCBMMTAwIDQ5IEw5OCA0NCBMOTMgNDIgWiIgZmlsbD0iI0ZFRjlDMyIgb3BhY2l0eT0iMC45IiBmaWx0ZXI9InVybCgjZ2xvdykiLz48cGF0aCBkPSJNMjggOTggTDI5IDk1IEwzMCA5OCBMMzMgOTkgTDMwIDEwMCBMMjkgMTAzIEwyOCAxMDAgTDI1IDk5IFoiIGZpbGw9IiNGREUwNDciIG9wYWNpdHk9IjAuNyIvPjxwYXRoIGQ9Ik05NSA5MCBMOTYgODcgTDk3IDkwIEwxMDAgOTEgTDk3IDkyIEw5NiA5NSBMOTUgOTIgTDkyIDkxIFoiIGZpbGw9IiNGRUYwOEEiIG9wYWNpdHk9IjAuOCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI0LCAyOSkiPjxyZWN0IHg9IjAiIHk9IjIyIiB3aWR0aD0iODAiIGhlaWdodD0iNTAiIHJ4PSI1IiByeT0iNSIgZmlsbD0idXJsKCNjbGFwcGVyLWJvZHktZ3JhZCkiLz48cGF0aCBkPSJNMzIgMzggTDUyIDUwIEwzMiA2MiBaIiBmaWxsPSIjMTExODI3Ii8+PGcgdHJhbnNmb3JtPSJyb3RhdGUoLTEwIDAgOSkiPjxwYXRoIGQ9Ik0wIDAgSDgwIEw3NSAxOCBILTUgWiIgZmlsbD0idXJsKCNjbGFwcGVyLXRvcC1ncmFkKSIvPjxwYXRoIGQ9Ik01IDIgSDE4IEwxMyAxNiBIMCB6IiBmaWxsPSIjMUYyOTM3Ii8+PHBhdGggZD0iTTI1IDIgSDM4IEwzMyAxNiBIMjAgeiIgZmlsbD0iIzFGMjkzNyIvPjxwYXRoIGQ9Ik00NSAyIEg1OCBMNTMgMTYgSDQwIHoiIGZpbGw9IiMxRjI5MzciLz48cGF0aCBkPSJNNjUgMiBINTggTDczIDE2IEg2MCB6IiBmaWxsPSIjMUYyOTM3Ii8+PC9nPjwvZz48L3N2Zz4=";
  return (
    <header className="sticky top-0 z-30 py-2 px-6 bg-backdrop backdrop-blur-md shadow-lg">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <div 
          onClick={onGoHome}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer"
        >
            <img src={iconDataUri} alt="SceneIt Logo" className="h-8 w-8" />
            <h1 className="text-xs font-bold bg-accent-gradient bg-clip-text text-transparent -mt-1">SceneIt</h1>
        </div>
        <div className="flex-1 min-w-0 max-w-3xl">
            <SearchBar onSelectResult={onSelectShow} onMarkShowAsWatched={onMarkShowAsWatched} value={query} onChange={onQueryChange} />
        </div>
        <div className="flex items-center justify-end" style={{ width: '150px' }}>
          {!currentUser && (
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
