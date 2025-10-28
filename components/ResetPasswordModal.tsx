import React, { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon } from './Icons';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (passwords: { currentPassword: string; newPassword: string }) => Promise<string | null>;
  onForgotPasswordRequest: (email: string) => Promise<string | null>;
  onForgotPasswordReset: (data: { code: string; newPassword: string }) => Promise<string | null>;
  currentUserEmail: string;
}

const InputField: React.FC<{ type: string, placeholder: string, value: string, onChange: (val: string) => void, icon?: React.ReactNode, readOnly?: boolean }> = ({ type, placeholder, value, onChange, icon, readOnly }) => (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        readOnly={readOnly}
        className={`w-full p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent ${readOnly ? 'cursor-not-allowed' : ''}`}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary/70">
        {icon}
      </div>
    </div>
);


const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onSave, onForgotPasswordRequest, onForgotPasswordReset, currentUserEmail }) => {
  const [view, setView] = useState<'change' | 'forgot_code'>('change');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      if (isOpen) {
          setView('change');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setResetCode('');
          setError(null);
          setInfo(null);
          setLoading(false);
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    if (!currentPassword || !newPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    const result = await onSave({ currentPassword, newPassword });
    if (result) {
      setError(result);
    } else {
      alert("Password updated successfully!");
      onClose();
    }
    setLoading(false);
  };

  const handleForgotRequest = async () => {
      setLoading(true);
      setError(null);
      setInfo(null);
      const result = await onForgotPasswordRequest(currentUserEmail);
      if (result) {
          setError(result);
      } else {
          setInfo("A reset code has been 'sent' to your email. Please check your inbox and enter it below.");
          setView('forgot_code');
      }
      setLoading(false);
  };

  const handleReset = async () => {
      setError(null);
      if (!resetCode || !newPassword) {
          setError("Please fill in all fields.");
          return;
      }
      if (newPassword !== confirmPassword) {
          setError("New passwords do not match.");
          return;
      }
      setLoading(true);
      const result = await onForgotPasswordReset({ code: resetCode, newPassword });
      if (result) {
          setError(result);
      } else {
          alert("Password has been reset successfully. You will be logged out and can log back in with your new password.");
          onClose();
          // The parent component should handle logout after this succeeds.
          // For now, we just close the modal.
      }
      setLoading(false);
  };

  const renderContent = () => {
      if (view === 'change') {
          return (
            <>
              <InputField type="password" placeholder="Current Password" value={currentPassword} onChange={setCurrentPassword} />
              <InputField type="password" placeholder="New Password" value={newPassword} onChange={setNewPassword} />
              <InputField type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />
              <div className="text-right">
                <button type="button" onClick={handleForgotRequest} className="text-sm font-semibold text-primary-accent hover:underline">
                    {loading ? 'Sending...' : 'Forgot your password?'}
                </button>
              </div>
            </>
          );
      } else { // 'forgot_code'
          return (
            <>
              <InputField type="email" placeholder="Email" value={currentUserEmail} onChange={()=>{}} readOnly icon={<EnvelopeIcon/>}/>
              <InputField type="text" placeholder="6-Digit Reset Code" value={resetCode} onChange={setResetCode} />
              <InputField type="password" placeholder="New Password" value={newPassword} onChange={setNewPassword} />
              <InputField type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />
            </>
          )
      }
  }

  const title = view === 'change' ? 'Reset Password' : 'Forgot Password';
  const buttonText = view === 'change' ? 'Save Password' : 'Reset Password';
  const submitAction = view === 'change' ? handleSave : handleReset;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
        
        {error && <p className="text-red-400 text-sm text-center bg-red-500/20 p-3 rounded-lg mb-4">{error}</p>}
        {info && <p className="text-blue-400 text-sm text-center bg-blue-500/20 p-3 rounded-lg mb-4">{info}</p>}
        
        <div className="space-y-4">
          {renderContent()}
        </div>

        <div className="flex justify-between items-center mt-6">
            {view === 'forgot_code' && (
                <button onClick={() => setView('change')} className="text-sm font-semibold text-primary-accent hover:underline">Back</button>
            )}
            <div className={`flex space-x-4 ${view === 'forgot_code' ? '' : 'ml-auto'}`}>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? 'Saving...' : buttonText}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;