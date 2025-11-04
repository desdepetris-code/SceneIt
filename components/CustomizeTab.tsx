import React from 'react';
import { PhotoIcon } from './Icons';
import { TmdbMediaDetails } from '../types';

interface CustomizeTabProps {
  posterUrl: string;
  backdropUrl: string;
  onOpenPosterSelector: () => void;
  onOpenBackdropSelector: () => void;
}

const CustomizeTab: React.FC<CustomizeTabProps> = ({ posterUrl, backdropUrl, onOpenPosterSelector, onOpenBackdropSelector }) => {
  return (
    <div className="animate-fade-in">
        <h2 className="text-xl font-bold text-text-primary mb-4">Customize Appearance</h2>
        <p className="text-text-secondary mb-6">Select a different poster or backdrop for this item. Your choice will be saved locally on this device.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={onOpenPosterSelector} className="cursor-pointer">
                <h3 className="font-semibold text-text-secondary mb-2">Current Poster</h3>
                <div className="relative group">
                    <img src={posterUrl} alt="Current poster" className="rounded-lg shadow-lg w-full aspect-[2/3] object-cover" />
                    <div 
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                        <PhotoIcon className="w-10 h-10 text-white" />
                        <span className="mt-2 text-white font-semibold">Change Poster</span>
                    </div>
                </div>
            </div>
             <div onClick={onOpenBackdropSelector} className="cursor-pointer">
                <h3 className="font-semibold text-text-secondary mb-2">Current Backdrop</h3>
                 <div className="relative group">
                    <img src={backdropUrl} alt="Current backdrop" className="rounded-lg shadow-lg w-full aspect-video object-cover" />
                    <div
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                        <PhotoIcon className="w-10 h-10 text-white" />
                        <span className="mt-2 text-white font-semibold">Change Backdrop</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CustomizeTab;
