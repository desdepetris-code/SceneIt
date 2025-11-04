import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: string | null;
  setPin: (pin: string | null) => void;
}

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, pin, setPin }) => {
    const [view, setView] = useState<'options' | 'create' | 'change' | 'remove'>('options');
    const [currentPinInput, setCurrentPinInput] = useState('');
    const [newPinInput, setNewPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setView(pin ? 'options' : 'create');
            setCurrentPinInput('');
            setNewPinInput('');
            setConfirmPinInput('');
            setError(null);
        }
    }, [isOpen, pin]);

    if (!isOpen) return null;

    const handleCreate = () => {
        setError(null);
        if (newPinInput.length !== 4) { setError("PIN must be 4 digits."); return; }
        if (newPinInput !== confirmPinInput) { setError("PINs do not match."); return; }
        setPin(newPinInput);
        alert("PIN created successfully!");
        onClose();
    };

    const handleChange = () => {
        setError(null);
        if (currentPinInput !== pin) { setError("Current PIN is incorrect."); return; }
        if (newPinInput.length !== 4) { setError("New PIN must be 4 digits."); return; }
        if (newPinInput !== confirmPinInput) { setError("New PINs do not match."); return; }
        setPin(newPinInput);
        alert("PIN changed successfully!");
        onClose();
    };
    
    const handleRemove = () => {
        setError(null);
        if (currentPinInput !== pin) { setError("PIN is incorrect."); return; }
        if (window.confirm("Are you sure you want to remove your PIN? You will need to use email recovery if you forget your password.")) {
            setPin(null);
            alert("PIN removed successfully.");
            onClose();
        }
    };

    const renderOptions = () => (
        <>
            <h2 className="text-xl font-bold mb-4">Manage PIN</h2>
            <div className="space-y-2">
                <button onClick={() => setView('change')} className="w-full p-3 rounded-md bg-bg-secondary hover:brightness-125">Change PIN</button>
                <button onClick={() => setView('remove')} className="w-full p-3 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20">Remove PIN</button>
            </div>
        </>
    );

    const renderCreate = () => (
        <>
            <h2 className="text-xl font-bold mb-4">Create a 4-Digit PIN</h2>
            <p className="text-sm text-text-secondary mb-4">This PIN can be used to quickly reset your password if you forget it.</p>
            <div className="space-y-4">
                <input type="password" placeholder="Enter new PIN" value={newPinInput} onChange={e => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-2 bg-bg-secondary rounded-md text-text-primary text-center tracking-[1em]" maxLength={4} />
                <input type="password" placeholder="Confirm new PIN" value={confirmPinInput} onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-2 bg-bg-secondary rounded-md text-text-primary text-center tracking-[1em]" maxLength={4} />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button onClick={onClose} className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary">Cancel</button>
                <button onClick={handleCreate} className="px-4 py-2 rounded-md bg-accent-gradient text-on-accent">Create PIN</button>
            </div>
        </>
    );
    
    const renderChange = () => (
        <>
            <h2 className="text-xl font-bold mb-4">Change PIN</h2>
            <div className="space-y-4">
                <input type="password" placeholder="Current PIN" value={currentPinInput} onChange={e => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-2 bg-bg-secondary rounded-md text-text-primary text-center tracking-[1em]" maxLength={4} />
                <input type="password" placeholder="New PIN" value={newPinInput} onChange={e => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-2 bg-bg-secondary rounded-md text-text-primary text-center tracking-[1em]" maxLength={4} />
                <input type="password" placeholder="Confirm New PIN" value={confirmPinInput} onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-2 bg-bg-secondary rounded-md text-text-primary text-center tracking-[1em]" maxLength={4} />
            </div>
            <div className="flex justify-between items-center mt-6">
                <button onClick={() => setView('options')} className="text-sm font-semibold text-primary-accent hover:underline">Back</button>
                <button onClick={handleChange} className="px-4 py-2 rounded-md bg-accent-gradient text-on-accent">Save Changes</button>
            </div>
        </>
    );

    const renderRemove = () => (
         <>
            <h2 className="text-xl font-bold mb-4 text-red-400">Remove PIN</h2>
            <p className="text-sm text-text-secondary mb-4">Enter your current PIN to confirm removal.</p>
            <input type="password" placeholder="Current PIN" value={currentPinInput} onChange={e => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-2 bg-bg-secondary rounded-md text-text-primary text-center tracking-[1em]" maxLength={4} />
            <div className="flex justify-between items-center mt-6">
                <button onClick={() => setView('options')} className="text-sm font-semibold text-primary-accent hover:underline">Back</button>
                <button onClick={handleRemove} className="px-4 py-2 rounded-md bg-red-600 text-white">Confirm Removal</button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
                {error && <p className="text-red-400 text-sm text-center bg-red-500/20 p-3 rounded-lg mb-4">{error}</p>}
                
                {view === 'options' && renderOptions()}
                {view === 'create' && renderCreate()}
                {view === 'change' && renderChange()}
                {view === 'remove' && renderRemove()}
            </div>
        </div>
    );
};

export default PinModal;