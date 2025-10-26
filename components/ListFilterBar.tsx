import React from 'react';
import { WatchStatus } from '../types';
import { ChevronDownIcon } from './Icons';

interface ListFilterBarProps {
  genres: Record<number, string>;
  selectedGenreId: number | null;
  onSelectGenre: (id: number | null) => void;
  selectedStatus: WatchStatus | null;
  onSelectStatus: (status: WatchStatus | null) => void;
}

const FilterSelect: React.FC<{
    value: string | number | null;
    onChange: (value: string) => void;
    children: React.ReactNode;
}> = ({ value, onChange, children }) => (
    <div className="relative flex-1">
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
        >
            {children}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
    </div>
);


const ListFilterBar: React.FC<ListFilterBarProps> = ({ genres, selectedGenreId, onSelectGenre, selectedStatus, onSelectStatus }) => {
  const sortedGenres = Object.entries(genres).sort(([, nameA], [, nameB]) => String(nameA).localeCompare(String(nameB)));
  
  const statuses: { id: WatchStatus | null, name: string }[] = [
    { id: null, name: 'All Statuses' },
    { id: 'watching', name: 'Watching' },
    { id: 'planToWatch', name: 'Plan to Watch' },
    { id: 'completed', name: 'Completed' },
    { id: 'favorites', name: 'Favorites' },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FilterSelect value={selectedStatus} onChange={(val) => onSelectStatus(val as WatchStatus | null)}>
        {statuses.map(s => <option key={s.name} value={s.id || ''}>{s.name}</option>)}
      </FilterSelect>
      <FilterSelect value={selectedGenreId} onChange={(val) => onSelectGenre(val ? Number(val) : null)}>
        <option value="">All Genres</option>
        {sortedGenres.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
        ))}
      </FilterSelect>
    </div>
  );
};

export default ListFilterBar;