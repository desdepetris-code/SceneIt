import React, { useState, useEffect } from 'react';
import { XMarkIcon, GlobeAltIcon, UsersIcon, LockClosedIcon } from './Icons';
import { CommentVisibility } from '../types';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaTitle: string;
  initialText?: string;
  onSave: (text: string, visibility: CommentVisibility) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  mediaTitle,
  initialText = '',
  onSave,
}) => {
  const [text, setText] = useState(initialText);
  const [visibility, setVisibility] = useState<CommentVisibility>('public');

  useEffect(() => {
    if (isOpen) {
      setText(initialText || '');
      setVisibility('public');
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSave(text, visibility);
    onClose();
  };

  const visibilityOptions: { id: CommentVisibility; label: string; icon: any; description: string }[] = [
    { id: 'public', label: 'Public', icon: GlobeAltIcon, description: 'Everyone can see this comment' },
    { id: 'followers', label: 'Followers Only', icon: UsersIcon, description: 'Only your followers can see this' },
    { id: 'private', label: 'Private', icon: LockClosedIcon, description: 'Only you can see this comment' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-primary rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-lg p-10 animate-fade-in relative border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <div className="mb-8">
            <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-1">
                Post Comment
            </h2>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 truncate">{mediaTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts with the community..."
            className="w-full h-40 p-5 bg-bg-secondary rounded-3xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent border border-white/5 shadow-inner font-medium leading-relaxed resize-none"
            required
            autoFocus
          />

          <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-4 block opacity-60 ml-2">Visibility Control</label>
              <div className="grid grid-cols-1 gap-2">
                  {visibilityOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setVisibility(opt.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${visibility === opt.id ? 'bg-primary-accent/10 border-primary-accent shadow-lg' : 'bg-bg-secondary/40 border-white/5 hover:bg-bg-secondary hover:border-white/10'}`}
                      >
                          <div className={`p-2 rounded-xl transition-colors ${visibility === opt.id ? 'bg-primary-accent text-on-accent' : 'bg-bg-primary text-text-secondary group-hover:text-text-primary'}`}>
                              <opt.icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                              <p className={`text-xs font-black uppercase tracking-widest ${visibility === opt.id ? 'text-primary-accent' : 'text-text-primary'}`}>{opt.label}</p>
                              <p className="text-[9px] font-bold text-text-secondary opacity-60 truncate uppercase tracking-tighter mt-0.5">{opt.description}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
                type="submit"
                className="w-full py-5 rounded-[1.5rem] bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs shadow-2xl transform transition-all hover:scale-[1.02] active:scale-95"
            >
                Finalize & Post
            </button>
            <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-text-secondary bg-bg-secondary font-black uppercase tracking-widest text-[9px] hover:text-text-primary transition-all"
            >
                Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModal;