import React from 'react';
import { StarIcon } from './Icons';

interface UserRatingStampProps {
    rating: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const UserRatingStamp: React.FC<UserRatingStampProps> = ({ rating, size = 'sm', className = '' }) => {
    if (!rating || rating <= 0) return null;

    const sizeClasses = {
        sm: 'px-1.5 py-0.5 text-[9px]',
        md: 'px-2 py-1 text-[11px]',
        lg: 'px-3 py-1.5 text-[14px]',
    };

    const iconSizes = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3.5 h-3.5',
    };

    return (
        <div 
            className={`flex flex-col items-center justify-center bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-700 text-black font-black uppercase rounded-lg shadow-[0_4px_12px_rgba(var(--color-accent-primary-rgb),0.6)] border border-yellow-200/50 z-20 group-hover:scale-110 transition-transform duration-300 ${sizeClasses[size]} ${className}`}
            style={{ boxShadow: '0 4px 15px var(--color-accent-primary)' }}
        >
            <div className="flex items-center gap-1">
                <StarIcon filled className={iconSizes[size]} />
                <span className="leading-none">{rating}</span>
            </div>
            <div className="text-[5px] sm:text-[6px] tracking-[0.2em] opacity-80 -mt-0.5">My Score</div>
        </div>
    );
};

export default UserRatingStamp;