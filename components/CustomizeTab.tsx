import React from 'react';
import { PhotoIcon, PlusIcon, InformationCircleIcon, CheckCircleIcon } from './Icons';
import { CustomImagePaths } from '../types';

interface CustomizeTabProps {
  posterUrl: string;
  backdropUrl: string;
  onOpenPosterSelector: () => void;
  onOpenBackdropSelector: () => void;
  showId: number;
  customImagePaths: CustomImagePaths;
}

const CustomizeTab: React.FC<CustomizeTabProps> = ({ posterUrl, backdropUrl, onOpenPosterSelector, onOpenBackdropSelector, showId, customImagePaths }) => {
  const hasCustomPoster = !!customImagePaths[showId]?.poster_path;
  const hasCustomBackdrop = !!customImagePaths[showId]?.backdrop_path;
  const gallery = customImagePaths[showId]?.gallery || [];

  return (
    <div className="animate-fade-in space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Chameleon Canvas</h2>
                <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60">Redesign your library entries</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={onOpenPosterSelector}
                    className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-primary-accent text-on-accent font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Asset Nomination
                </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-accent shadow-[0_0_10px_var(--color-accent-primary)]"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Primary Poster</h3>
                    </div>
                    {hasCustomPoster && <span className="text-[8px] font-black uppercase tracking-widest text-primary-accent flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Locked Artwork</span>}
                </div>
                <div onClick={!hasCustomPoster ? onOpenPosterSelector : undefined} className={`relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 aspect-[2/3] bg-bg-secondary/40 ${!hasCustomPoster ? 'cursor-pointer group' : ''}`}>
                    <img src={posterUrl} alt="Current poster" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    {!hasCustomPoster && (
                        <div 
                            className="absolute bottom-6 right-6 z-20"
                        >
                            <div className="p-5 bg-white rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-black/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                style={{ mixBlendMode: 'difference', filter: 'invert(1)' }}>
                                <PhotoIcon className="w-10 h-10 text-black" />
                            </div>
                        </div>
                    )}
                    <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 shadow-lg">{hasCustomPoster ? 'Locked Artwork' : 'Active Presentation'}</div>
                </div>
            </div>

             <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-accent shadow-[0_0_10px_var(--color-accent-primary)]"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Primary Backdrop</h3>
                    </div>
                    {hasCustomBackdrop && <span className="text-[8px] font-black uppercase tracking-widest text-primary-accent flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Locked Scenery</span>}
                </div>
                <div onClick={!hasCustomBackdrop ? onOpenBackdropSelector : undefined} className={`relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 aspect-video bg-bg-secondary/40 ${!hasCustomBackdrop ? 'cursor-pointer group' : ''}`}>
                    <img src={backdropUrl} alt="Current backdrop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    {!hasCustomBackdrop && (
                        <div
                            className="absolute bottom-6 right-6 z-20"
                        >
                            <div className="p-5 bg-white rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-black/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                style={{ mixBlendMode: 'difference', filter: 'invert(1)' }}>
                                <PhotoIcon className="w-10 h-10 text-black" />
                            </div>
                        </div>
                    )}
                    <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 shadow-lg">{hasCustomBackdrop ? 'Locked Scenery' : 'Active Presentation'}</div>
                </div>
            </div>
        </div>

        {gallery.length > 0 && (
            <section className="pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Custom Asset Gallery</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                    {gallery.map((img, i) => (
                        <div key={i} className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl border border-white/5 group/asset">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/asset:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <CheckCircleIcon className="w-8 h-8 text-white opacity-40" />
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={onOpenPosterSelector}
                        className="aspect-[2/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-text-secondary/20 hover:border-primary-accent/40 hover:bg-primary-accent/5 hover:text-primary-accent transition-all group"
                    >
                        <PlusIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add more</span>
                    </button>
                </div>
            </section>
        )}

        <div className="p-10 bg-bg-secondary/10 rounded-[3rem] border-2 border-dashed border-white/5 text-center">
            <InformationCircleIcon className="w-12 h-12 text-text-secondary/20 mx-auto mb-6" />
            <p className="text-sm text-text-secondary font-medium px-12 leading-relaxed max-w-2xl mx-auto">
                Personalized art is stored <span className="text-primary-accent">locally</span> on this device. Once an image is assigned to a view, the action is finalized to preserve your curation. You can nominate additional images to your show gallery to maintain a collection of alternative assets.
            </p>
        </div>
    </div>
  );
};

export default CustomizeTab;