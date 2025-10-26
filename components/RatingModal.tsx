import React, { useState } from 'react';
import { StarIcon } from './Icons';

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
        <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                    key={star}
                    className="w-12 h-12 cursor-pointer"
                    filled={(hoverRating || rating) >= star}
                    onClick={() => onRatingChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                />
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">Rate this!</h2>
        <p className="text-text-secondary mb-6 text-center">{mediaTitle}</p>
        
        <StarRating rating={rating} onRatingChange={setRating} />

        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity"
          >
            Save Rating
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
