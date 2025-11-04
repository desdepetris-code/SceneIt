import React, { useState, useEffect } from 'react';
import { TmdbImage } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';

interface ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  posters: TmdbImage[];
  backdrops: TmdbImage[];
  onSelect: (type: 'poster' | 'backdrop', path: string) => void;
  initialTab?: 'posters' | 'backdrops';
}

const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({ isOpen, onClose, posters, backdrops, onSelect, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'posters' | 'backdrops'>(initialTab || 'posters');

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab || 'posters');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSelect = (type: 'poster' | 'backdrop', path: string) => {
    onSelect(type, path);
    onClose();
  };
  
  const imagesToShow = activeTab === 'posters' ? posters : backdrops;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Customize Appearance</h2>
        
        <div className="flex p-1 bg-bg-secondary rounded-full mb-4 self-start">
            <button
                onClick={() => setActiveTab('posters')}
                className={`px-6 py-1.5 text-sm font-semibold rounded-full transition-all ${
                activeTab === 'posters' ? 'bg-accent-gradient text-white shadow-lg' : 'text-text-secondary'
                }`}
            >
                Posters ({posters.length})
            </button>
            <button
                onClick={() => setActiveTab('backdrops')}
                className={`px-6 py-1.5 text-sm font-semibold rounded-full transition-all ${
                activeTab === 'backdrops' ? 'bg-accent-gradient text-white shadow-lg' : 'text-text-secondary'
                }`}
            >
                Backdrops ({backdrops.length})
            </button>
        </div>

        <div className="flex-grow overflow-y-auto">
            {imagesToShow.length > 0 ? (
                <div className={`grid gap-4 ${activeTab === 'posters' ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {imagesToShow.map(image => (
                        <div key={image.file_path} className="cursor-pointer group relative rounded-lg overflow-hidden" onClick={() => handleSelect(activeTab === 'posters' ? 'poster' : 'backdrop', image.file_path)}>
                            <img 
                                src={`${TMDB_IMAGE_BASE_URL}${activeTab === 'posters' ? 'w342' : 'w500'}${image.file_path}`}
                                alt=""
                                className="w-full h-full object-cover transition-transform transform group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <p className="text-white font-bold">Select</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-text-secondary text-center mt-8">No alternative {activeTab} available.</p>
            )}
        </div>
        
        <div className="flex justify-end mt-4">
            <button
                onClick={onClose}
                className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectorModal;
