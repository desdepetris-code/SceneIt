import React from 'react';

interface MoodSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMood: (mood: string) => void;
  currentMood?: string;
}

const moods = ['😊', '😂', '😍', '😢', '🤯', '🤔', '😠', '😴', '🥳', '😡', '🤮', '💔'];

const MoodSelectorModal: React.FC<MoodSelectorModalProps> = ({ isOpen, onClose, onSelectMood, currentMood }) => {
  if (!isOpen) return null;

  const handleSelect = (mood: string) => {
    onSelectMood(mood);
    onClose();
  };

  const handleRemoveMood = () => {
    onSelectMood(''); // Pass an empty string to signify removal
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-4 text-center">How did it make you feel?</h2>
        <div className="grid grid-cols-4 gap-4">
          {moods.map(m => (
            <button
              key={m}
              onClick={() => handleSelect(m)}
              className={`text-4xl p-2 rounded-full transition-transform transform hover:scale-125 ${currentMood === m ? 'bg-primary-accent/20 scale-110' : 'bg-transparent'}`}
              aria-label={`Mood: ${m}`}
            >
              {m}
            </button>
          ))}
        </div>
        {currentMood && (
             <div className="text-center mt-6">
                <button onClick={handleRemoveMood} className="text-sm text-text-secondary hover:text-red-500 transition-colors">
                    Remove Mood
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default MoodSelectorModal;