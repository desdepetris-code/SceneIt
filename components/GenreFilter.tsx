import React from 'react';
import Carousel from './Carousel';

interface GenreFilterProps {
  genres: Record<number, string>;
  selectedGenreId: number | null;
  onSelectGenre: (id: number | null) => void;
}

const GenreFilter: React.FC<GenreFilterProps> = ({ genres, selectedGenreId, onSelectGenre }) => {
  // Explicitly cast to string to resolve 'unknown' type inference issue.
  const sortedGenres = Object.entries(genres).sort(([, nameA], [, nameB]) => String(nameA).localeCompare(String(nameB)));

  return (
    <div className="mb-6 px-6">
      <h3 className="text-lg font-semibold text-text-secondary mb-3">Filter by Genre</h3>
      <Carousel>
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
          <button
            onClick={() => onSelectGenre(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedGenreId === null
                ? 'bg-accent-gradient text-white'
                : 'bg-bg-secondary text-text-secondary hover:brightness-125'
            }`}
          >
            All
          </button>
          {sortedGenres.map(([id, name]) => (
            <button
              key={id}
              onClick={() => onSelectGenre(Number(id))}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedGenreId === Number(id)
                  ? 'bg-accent-gradient text-white'
                  : 'bg-bg-secondary text-text-secondary hover:brightness-125'
              }`}
            >
              {name}
            </button>
          ))}
          <div className="w-2 flex-shrink-0"></div>
        </div>
      </Carousel>
    </div>
  );
};

export default GenreFilter;
