import React, { useState } from 'react';
import { QuestionMarkCircleIcon } from './Icons';
import ReportIssueModal from './ReportIssueModal';

interface PageChangeRequestProps {
  mediaTitle: string;
  mediaId: number;
}

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; }> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center space-y-1 w-full h-full p-2 rounded-lg border transition-all bg-bg-secondary border-bg-secondary/80 text-text-primary hover:border-primary-accent hover:bg-bg-secondary/70`}
    >
        {icon}
        <span className="text-xs font-semibold text-center">{label}</span>
    </button>
);

const PageChangeRequest: React.FC<PageChangeRequestProps> = ({ mediaTitle, mediaId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const options = ["Wrong Details", "Insufficient Info", "Incorrect Poster", "Missing Content", "Other Error"];

  const handleSelect = (option: string) => {
    const subject = `SceneIt Page Change Request: ${mediaTitle} (ID: ${mediaId})`;
    const body = `Hi SceneIt team,\n\nI'm reporting an issue with the page for "${mediaTitle}" (ID: ${mediaId}).\n\nIssue Type: ${option}\n\nDetails:\n[Please describe the issue here]\n\nThanks,`;
    window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setIsModalOpen(false);
  };

  return (
    <>
      <ReportIssueModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        options={options}
      />
      <ActionButton
          icon={<QuestionMarkCircleIcon className="w-7 h-7" />}
          label="Report Issue"
          onClick={() => setIsModalOpen(true)}
      />
    </>
  );
};

export default PageChangeRequest;