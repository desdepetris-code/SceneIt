import React, { useState } from 'react';
import { ChevronLeftIcon, EnvelopeIcon } from '../components/Icons';
import TermsOfService from '../components/TermsOfService';
import PrivacyPolicy from '../components/PrivacyPolicy';

interface LegalProps {
  onBack: () => void;
}

type LegalTab = 'tos' | 'privacy';

const Legal: React.FC<LegalProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>('tos');

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
      <header className="flex items-center mb-6 relative">
        <button onClick={onBack} className="absolute left-0 p-2 bg-backdrop rounded-full text-text-primary">
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-text-primary text-center w-full">Legal & Policies</h1>
      </header>

      <div className="flex justify-center mb-8">
        <div className="flex p-1 bg-bg-secondary rounded-full">
          <button
            onClick={() => setActiveTab('tos')}
            className={`px-6 py-1.5 text-sm font-semibold rounded-full transition-all ${
              activeTab === 'tos' ? 'bg-accent-gradient text-on-accent font-semibold shadow-lg' : 'text-text-secondary'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-1.5 text-sm font-semibold rounded-full transition-all ${
              activeTab === 'privacy' ? 'bg-accent-gradient text-on-accent font-semibold shadow-lg' : 'text-text-secondary'
            }`}
          >
            Privacy Policy
          </button>
        </div>
      </div>

      <div className="bg-card-gradient rounded-lg shadow-md p-6">
        {activeTab === 'tos' ? <TermsOfService /> : <PrivacyPolicy />}
      </div>
      
      {activeTab === 'tos' && (
        <div className="mt-8 text-center">
          <a
            href="mailto:sceneit623@gmail.com?subject=DMCA%20Notice"
            className="inline-flex items-center px-6 py-3 rounded-md text-on-accent bg-accent-gradient hover:opacity-90 transition-opacity font-semibold shadow-lg"
          >
            <EnvelopeIcon className="w-5 h-5 mr-2" />
            Contact DMCA Agent
          </a>
        </div>
      )}
    </div>
  );
};

export default Legal;