
import React from 'react';
import { TrackedItem } from '../types';
import ShowCard from './ShowCard';
import Carousel from './Carousel';
import { TrophyIcon, SparklesIcon } from './Icons';

interface WeeklyFavoritesProps {
  items: TrackedItem[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onNominate: () => void;
}

const WeeklyFavorites: React.FC<WeeklyFavoritesProps> = ({ items, onSelectShow, onNominate }) => {
  return (
    <div className="my-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>
      
      <div className="relative z-10 px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                    <TrophyIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Weekly Picks</h2>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Your Top 5 This Week</p>
                </div>
            </div>
            {items.length > 0 && items.length < 5 && (
                <button 
                    onClick={onNominate}
                    className="text-xs font-black text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                    <SparklesIcon className="w-3 h-3" />
                    Nominate More
                </button>
            )}
          </div>

          {items.length > 0 ? (
            <Carousel>
              <div className="flex overflow-x-auto py-4 -mx-2 px-2 space-x-4 hide-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="w-40 sm:w-48 flex-shrink-0 relative">
                    <div className="absolute -top-2 -left-2 z-20 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-lg transform -rotate-12 border border-black/10">
                        PICK
                    </div>
                    <ShowCard item={item} onSelect={onSelectShow} />
                  </div>
                ))}
                <div className="w-4 flex-shrink-0"></div>
              </div>
            </Carousel>
          ) : (
            <div className="bg-bg-secondary/40 border border-yellow-500/20 rounded-xl p-8 text-center animate-fade-in">
                <TrophyIcon className="w-12 h-12 text-yellow-500/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-primary mb-1">Weekly Picks Empty</h3>
                <p className="text-sm text-text-secondary max-w-xs mx-auto mb-4">You haven't nominated your favorite shows or movies for this week yet.</p>
                <button 
                    onClick={onNominate}
                    className="px-6 py-2 bg-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-yellow-400 transition-all transform hover:scale-105"
                >
                    Nominate Picks
                </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default WeeklyFavorites;
