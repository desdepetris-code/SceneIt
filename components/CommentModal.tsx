import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  mediaTitle: string;
  initialText?: string;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, onSave, mediaTitle, initialText = '' }) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-text-primary mb-2">My Comment</h2>
        <p className="text-text-secondary mb-4">{mediaTitle}</p>
        
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add your comment..."
          className="w-full h-40 p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
        />

        <div className="flex justify-end space-x-4 mt-6">
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
            Save Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
