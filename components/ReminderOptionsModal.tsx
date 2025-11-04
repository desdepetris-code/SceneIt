import React from 'react';
import { ReminderType } from '../types';

interface ReminderOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: ReminderType) => void;
}

const ReminderOptionsModal: React.FC<ReminderOptionsModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl p-4 space-y-2 w-full max-w-xs" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-center mb-2">Remind Me...</h3>
                <button onClick={() => onSelect('release')} className="w-full text-left p-2 rounded-md bg-bg-secondary hover:brightness-125">At time of release</button>
                <button onClick={() => onSelect('day_before')} className="w-full text-left p-2 rounded-md bg-bg-secondary hover:brightness-125">1 day before</button>
                <button onClick={() => onSelect('week_before')} className="w-full text-left p-2 rounded-md bg-bg-secondary hover:brightness-125">1 week before</button>
            </div>
        </div>
    );
}

export default ReminderOptionsModal;