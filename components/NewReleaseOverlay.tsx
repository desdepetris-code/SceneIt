import React from 'react';

interface NewReleaseOverlayProps {
    text?: string;
    position?: 'top-left' | 'top-right';
    color?: 'cyan' | 'rose';
}

export const NewReleaseOverlay: React.FC<NewReleaseOverlayProps> = ({ text = 'NEW', position = 'top-left', color = 'cyan' }) => {
    const positionClass = position === 'top-left' ? 'top-2 left-2' : 'top-2 right-2';
    const colorClass = color === 'cyan' ? 'bg-cyan-600/80' : 'bg-rose-600/80';
    
    return (
        <div className={`absolute ${positionClass} px-2 py-1 ${colorClass} text-white text-xs font-bold rounded-md backdrop-blur-sm shadow-lg z-10`}>
            {text}
        </div>
    );
};
