import React from 'react';
import { XMarkIcon } from './Icons';
import Logo from './Logo';

interface LogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoModal: React.FC<LogoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="relative max-w-2xl w-full flex flex-col items-center animate-scale-in" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute -top-16 right-0 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-2xl"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
        
        <div className="bg-bg-primary rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative group flex justify-center items-center">
          <Logo className="w-64 h-64 drop-shadow-[0_20px_50px_rgba(65,105,225,0.4)]" />
          <div className="absolute inset-0 bg-accent-gradient opacity-5 pointer-events-none"></div>
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">CineMontauge</h2>
          <p className="text-text-secondary font-black uppercase tracking-[0.4em] text-xs opacity-60">Elite Cinematic Tracking</p>
        </div>
      </div>
    </div>
  );
};

export default LogoModal;