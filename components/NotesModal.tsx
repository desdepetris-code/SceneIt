import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from './Icons';
import { Note } from '../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: Note[]) => void;
  mediaTitle: string;
  initialNotes?: Note[];
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, onSave, mediaTitle, initialNotes = [] }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNotes([...initialNotes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setNewNoteText('');
    }
  }, [isOpen, initialNotes]);

  if (!isOpen) return null;

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      timestamp: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setNewNoteText('');
    onSave(updatedNotes); // Save immediately
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        onSave(updatedNotes); // Save immediately
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-text-primary mb-2">My Notes</h2>
        <p className="text-text-secondary mb-4 truncate">{mediaTitle}</p>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-4">
            {notes.length > 0 ? notes.map(note => (
                <div key={note.id} className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg -rotate-1 transform border border-yellow-300/50 dark:border-yellow-700/50 group">
                    <div className="flex justify-between items-start">
                        <p className="text-yellow-900 dark:text-yellow-100 whitespace-pre-wrap text-sm flex-grow">{note.text}</p>
                        <button onClick={() => handleDeleteNote(note.id)} className="ml-2 p-1 text-yellow-700 dark:text-yellow-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 text-right">{new Date(note.timestamp).toLocaleString()}</p>
                </div>
            )) : (
                <p className="text-text-secondary text-center py-8">No notes yet. Add your first note below!</p>
            )}
        </div>
        
        <div className="flex-shrink-0">
            <textarea
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              placeholder="Add a new note..."
              className="w-full h-24 p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
            />

            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all"
              >
                Close
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Add Note
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;