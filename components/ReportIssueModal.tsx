import React from 'react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
  options: string[];
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, onSelect, options }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-primary mb-4">Report an Issue</h2>
        <div className="space-y-2">
          {options.map(option => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className="w-full text-left p-3 rounded-md bg-bg-secondary hover:brightness-125 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportIssueModal;
