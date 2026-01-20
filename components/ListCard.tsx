import React from 'react';
import { CustomList } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { GlobeAltIcon, LockClosedIcon, ListBulletIcon } from './Icons';

interface ListCardProps {
    list: CustomList;
    onClick: () => void;
}

const ListCard: React.FC<ListCardProps> = ({ list, onClick }) => {
    const previewItems = list.items.slice(0, 3);
    const isEmpty = list.items.length === 0;

    return (
        <div 
            onClick={onClick}
            className="group relative flex flex-col bg-bg-secondary/20 rounded-[2rem] border border-white/5 overflow-hidden hover:border-primary-accent/40 transition-all shadow-xl cursor-pointer h-full"
        >
            {/* Poster Stack Preview */}
            <div className="relative h-48 bg-black/40 flex items-center justify-center overflow-hidden">
                {!isEmpty ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        {previewItems.map((item, index) => (
                            <img
                                key={item.id}
                                src={getImageUrl(item.poster_path, 'w185')}
                                alt=""
                                className="absolute w-24 h-36 object-cover rounded-lg shadow-2xl border border-white/10 transition-transform duration-500 group-hover:scale-105"
                                style={{
                                    zIndex: 3 - index,
                                    transform: `translateX(${(index - (previewItems.length - 1) / 2) * 25}px) rotate(${(index - (previewItems.length - 1) / 2) * 8}deg)`,
                                    opacity: 1 - index * 0.2
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center opacity-20">
                        <ListBulletIcon className="w-12 h-12 text-text-secondary" />
                        <span className="text-[10px] font-black uppercase tracking-widest mt-2">Empty Collection</span>
                    </div>
                )}
                
                {/* Privacy Badge */}
                <div className="absolute top-4 left-4 z-10">
                    {list.isPublic ? (
                        <div className="p-2 bg-sky-500/20 backdrop-blur-md rounded-xl border border-sky-400/30 text-sky-400">
                            <GlobeAltIcon className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="p-2 bg-bg-primary/60 backdrop-blur-md rounded-xl border border-white/10 text-text-secondary">
                            <LockClosedIcon className="w-4 h-4" />
                        </div>
                    )}
                </div>

                {/* Count Badge */}
                <div className="absolute bottom-4 right-4 z-10 px-3 py-1 bg-primary-accent text-on-accent rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {list.items.length} {list.items.length === 1 ? 'Item' : 'Items'}
                </div>
            </div>

            {/* List Info */}
            <div className="p-6">
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight group-hover:text-primary-accent transition-colors truncate">
                    {list.name}
                </h3>
                <p className="text-xs text-text-secondary font-medium line-clamp-2 mt-1 opacity-60 h-8">
                    {list.description || "A curated cinematic collection."}
                </p>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-text-secondary/40">
                    <span>Created {new Date(list.createdAt).toLocaleDateString()}</span>
                    <span className="group-hover:text-primary-accent transition-colors">Open Collection →</span>
                </div>
            </div>
        </div>
    );
};

export default ListCard;