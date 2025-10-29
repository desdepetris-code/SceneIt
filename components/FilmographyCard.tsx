import React from 'react';
import { PersonCredit } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { StarIcon, ClockIcon } from './Icons';
import BrandedImage from './BrandedImage';

interface FilmographyCardProps {
    item: PersonCredit;
    isFavorite: boolean;
    userRating: number;
    onSelect: () => void;
    onToggleFavorite: () => void;
    onRate: () => void;
    onShowHistory: () => void;
}

const FilmographyCard: React.FC<FilmographyCardProps> = ({ item, isFavorite, userRating, onSelect, onToggleFavorite, onRate, onShowHistory }) => {
    const title = item.title || item.name || 'Untitled';
    const year = item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4);

    return (
        <div className="bg-card-gradient rounded-lg shadow-md flex flex-col">
            <div className="relative cursor-pointer" onClick={onSelect}>
                <BrandedImage title={title}>
                    <img src={getImageUrl(item.poster_path, 'w342')} alt={title} className="w-full aspect-[2/3] object-cover rounded-t-lg" />
                </BrandedImage>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-2 pl-8">
                    <h4 className="text-white text-sm font-bold">{title}</h4>
                    {year && <p className="text-slate-300 text-xs">{year}</p>}
                </div>
            </div>
            <div className="p-2 flex justify-around items-center border-t border-bg-secondary/50">
                <button onClick={onToggleFavorite} className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-primary-accent' : 'text-text-secondary hover:text-primary-accent'}`} aria-label="Favorite">
                    <StarIcon filled={isFavorite} className="w-5 h-5" />
                </button>
                <button onClick={onRate} className={`p-1.5 rounded-full flex items-center space-x-1 transition-colors ${userRating > 0 ? 'text-primary-accent' : 'text-text-secondary hover:text-primary-accent'}`} aria-label="Rate">
                    <StarIcon className="w-5 h-5" />
                    {userRating > 0 && <span className="text-xs font-bold">{userRating}</span>}
                </button>
                <button onClick={onShowHistory} className="p-1.5 rounded-full text-text-secondary hover:text-primary-accent transition-colors" aria-label="View History">
                    <ClockIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default FilmographyCard;
