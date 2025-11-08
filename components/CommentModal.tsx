
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaTitle: string;
  initialText?: string;
  onSave: (text: string) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  mediaTitle,
  initialText = '',
  onSave,
}) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (isOpen) {
      setText(initialText || '');
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSave(text);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-primary rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Add Comment
        </h2>
        <p className="text-text-secondary mb-4 truncate">{mediaTitle}</p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Join the discussion..."
            className="w-full h-32 p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
            required
            autoFocus
          />
          <div className="flex justify-end items-center mt-4">
            <div className="space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md text-text-primary hover:bg-bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold rounded-md bg-accent-gradient text-on-accent hover:opacity-90"
              >
                Post Comment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModal;
