import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { username: string; email: string }) => Promise<string | null>;
  currentUser: { username: string; email: string } | null;
}

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({ isOpen, onClose, onSave, currentUser }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            setUsername(currentUser.username);
            setEmail(currentUser.email);
            setError(null);
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setError(null);
        if (!username.trim() || !email.trim()) {
            setError("Username and email cannot be empty.");
            return;
        }
        setLoading(true);
        const result = await onSave({ username, email });
        if (result) {
            setError(result);
        } else {
            alert("Profile updated successfully!");
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary">
                    <XMarkIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-4">Update Profile</h2>

                {error && <p className="text-red-400 text-sm text-center bg-red-500/20 p-3 rounded-lg mb-4">{error}</p>}
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-text-secondary mb-1 block">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-text-secondary mb-1 block">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent" />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-md bg-accent-gradient text-on-accent disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateProfileModal;