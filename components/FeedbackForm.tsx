import React, { useState } from 'react';

interface FeedbackFormProps {
  onFeedbackSubmit: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onFeedbackSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('Feature Request');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      alert('Please fill out the Subject and Message fields.');
      return;
    }
    const mailtoSubject = `SceneIt: ${requestType} - ${subject}`;
    const mailtoBody = `Name: ${name || 'Not provided'}\nEmail: ${email || 'Not provided'}\n\nMessage:\n${message}`;
    window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;
    onFeedbackSubmit();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setRequestType('Feature Request');
  };

  if (submitted) {
    return (
      <div className="p-4 m-4 text-center bg-green-500/20 text-green-300 rounded-lg">
        <p className="font-semibold">Your email client has been opened.</p>
        <p className="text-sm">Please send the pre-filled email to submit your feedback.</p>
        <button
          onClick={handleReset}
          className="mt-4 px-4 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity font-semibold"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  const inputClass = "w-full bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="text" placeholder="Name (Optional)" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
        <input type="email" placeholder="Email (Optional)" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
      </div>
      <p className="text-xs text-text-secondary text-center -mt-2 px-2">
        Feedback is sent to <strong className="text-text-secondary/80">sceneit623@gmail.com</strong>. This will open your default email client.
      </p>
      <div className="relative">
        <select value={requestType} onChange={e => setRequestType(e.target.value)} className={`${inputClass} appearance-none`}>
            <option>Feature Request</option>
            <option>Update Suggestion</option>
            <option>Bug Report</option>
            <option>Data Correction</option>
            <option>UI/UX Feedback</option>
            <option>General Question</option>
            <option>Account Help</option>
        </select>
      </div>
      <input type="text" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} required />
      <textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} className={inputClass} rows={5} required></textarea>
      <button type="submit" className="w-full py-3 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity font-semibold">
        Submit Request
      </button>
    </form>
  );
};
export default FeedbackForm;