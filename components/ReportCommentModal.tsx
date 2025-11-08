import React, { useState } from 'react';
import { XMarkIcon } from './Icons';

interface ReportCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUsername: string;
  onReport: (reason: string, comments: string) => void;
}

const ReportCommentModal: React.FC<ReportCommentModalProps> = ({ isOpen, onClose, reportedUsername, onReport }) => {
    const [reason, setReason] = useState('Spam');
    const [comments, setComments] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onReport(reason, comments);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold mb-2">Report Comment</h2>
                <p className="text-text-secondary mb-4">You are reporting a comment by <strong className="text-text-primary">{reportedUsername}</strong>.</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-text-secondary mb-1 block">Reason</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        >
                            <option>Spam</option>
                            <option>Harassment</option>
                            <option>Inappropriate Content / Spoilers</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-text-secondary mb-1 block">Additional Comments (Optional)</label>
                        <textarea
                            placeholder="Provide more details..."
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            className="w-full h-24 p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-red-600 text-white">Submit Report</button>
                </div>
            </div>
        </div>
    );
};

export default ReportCommentModal;