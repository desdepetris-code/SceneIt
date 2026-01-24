import React, { useState } from 'react';
import { StarIcon, XMarkIcon, TrashIcon } from './Icons';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rating: number) => void;
  currentRating: number;
  mediaTitle: string;
}

const StarRating: React.FC<{ rating: number; onRatingChange: (rating: number) => void }> = ({ rating, onRatingChange }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform active:scale-90"
                    onClick={() => onRatingChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                >
                    <StarIcon
                        className={`w-8 h-8 sm:w-10 sm:h-10 cursor-pointer transition-colors ${
                            (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-text-secondary opacity-30'
                        }`}
                        filled={(hoverRating || rating) >= star}
                    />
                </button>
            ))}
        </div>
    );
};


const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSave, currentRating, mediaTitle }) => {
  const [rating, setRating] = useState(currentRating);

  React.useEffect(() => {
    setRating(currentRating);
  }, [currentRating, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(rating);
    onClose();
  };

  const handleRemove = () => {
      onSave(0);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-fade-in relative border border-white/10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-1">Rate this</h2>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-60 truncate">{mediaTitle}</p>
        </div>
        
        <div className="py-4">
            <StarRating rating={rating} onRatingChange={setRating} />
            <div className="text-center mt-6 flex flex-col items-center">
                <span className="text-4xl font-black text-primary-accent italic">{rating || '—'}<span className="text-sm opacity-40 not-italic ml-1">/ 10</span></span>
                {currentRating > 0 && (
                    <button 
                        onClick={handleRemove}
                        className="mt-4 flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Remove My Rating
                    </button>
                )}
            </div>
        </div>

        <div className="flex flex-col space-y-3 mt-8">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl text-white bg-accent-gradient font-black uppercase tracking-widest text-sm hover:opacity-90 transition-opacity shadow-xl"
          >
            Confirm Score
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-text-secondary bg-bg-secondary font-black uppercase tracking-widest text-[10px] hover:text-text-primary transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;