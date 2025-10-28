import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="prose-styles">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Terms of Service</h1>
      <p className="text-text-secondary mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="text-text-secondary mb-4">Welcome to SceneIt ("the Service"). By using our application, you agree to these terms. Please read them carefully.</p>
      
      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">1. Age Requirement</h2>
      <p className="text-text-secondary mb-4">You must be at least 13 years of age to create an account and use the Service. By using SceneIt, you represent and warrant that you meet this requirement.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">2. Accounts</h2>
      <p className="text-text-secondary mb-4">When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
      <p className="text-text-secondary mb-4">You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">3. User Conduct</h2>
      <p className="text-text-secondary mb-4">You agree not to use SceneIt to:</p>
      <ul>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Upload, post, or link to any content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Infringe on any third party's intellectual property rights, including copyright, trademark, or patent.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Strictly prohibit hosting, streaming, or providing download/magnet links to copyrighted material for which you do not own the rights.</strong> Our service is for personal tracking and journaling, not for distributing content.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Attempt to disrupt or interfere with our servers or networks.</li>
      </ul>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">4. Third-Party Services &amp; Data Attribution</h2>
      <p className="text-text-secondary mb-4">SceneIt is a personal tracking tool and does not host, stream, or provide links to any copyrighted media files. To provide rich media information, we utilize several third-party APIs. The distinction in their usage is as follows:</p>

      <ul className="list-disc ml-6 space-y-4 text-text-secondary">
        <li>
          <strong className="font-semibold text-text-primary">The Movie Database (TMDB):</strong> This is our primary source for metadata. The vast majority of movie, TV show, and person data—including titles, synopses, posters, cast/crew information, and ratings—is supplied by the TMDB API.
          <br />
          <em className="text-text-secondary/80 mt-2 block">This product uses the TMDB API but is not endorsed or certified by TMDB. We are grateful for their incredible service. All users must comply with TMDB's API Terms of Use, available at <a href="https://www.themoviedb.org/documentation/api/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-primary-accent underline">themoviedb.org</a>.</em>
        </li>
        <li>
          <strong className="font-semibold text-text-primary">The TV Database (TVDB):</strong> This is a supplementary data source for TV shows. We use the TVDB API to enrich our data, providing alternative poster images and a more comprehensive list of characters to enhance the user experience.
        </li>
        <li>
          <strong className="font-semibold text-text-primary">Trakt.tv:</strong> This service is used for user data import functionality. By connecting your Trakt.tv account, you can import your existing watch history, watchlist, and ratings into SceneIt, helping you get started quickly. We do not send your SceneIt data back to Trakt.
        </li>
      </ul>


      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">5. Intellectual Property &amp; DMCA Policy</h2>
      <p className="text-text-secondary mb-4">SceneIt respects the intellectual property rights of others and expects its users to do the same. We comply with the Digital Millennium Copyright Act (DMCA).</p>
      
      <h3 className="text-xl font-bold text-text-primary mt-4 mb-2">DMCA & Copyright Policy</h3>
      <p className="text-text-secondary mb-4">SceneIt respects copyright and intellectual property rights. If you believe your work has been used without permission, please contact our DMCA agent.</p>
      
      <div className="p-4 bg-bg-secondary rounded-lg space-y-2 mb-4">
        <p className="text-text-secondary">
          <strong className="font-semibold text-text-primary">Preferred Contact (Email only if possible):</strong> <a href="mailto:sceneit623@gmail.com" className="text-primary-accent underline">sceneit623@gmail.com</a>
        </p>
        <p className="text-text-secondary">
          <strong className="font-semibold text-text-primary">Mailing Address:</strong> For privacy reasons, our mailing address for formal legal correspondence is available upon request via email. Email remains the preferred method for all notices.
        </p>
        <p className="text-text-secondary">
          <strong className="font-semibold text-text-primary">Phone (optional):</strong> (229) 392-9884
        </p>
      </div>

      <p className="text-text-secondary mb-4">Please include in your notice:</p>
      <ol className="list-decimal ml-6 space-y-2 text-text-secondary">
        <li>Description of the copyrighted work.</li>
        <li>Location of the infringing material in the app.</li>
        <li>Your contact info.</li>
        <li>Statement of good faith belief that use is unauthorized.</li>
        <li>Statement under penalty of perjury that info is accurate and you are the owner or authorized agent.</li>
        <li>Your signature (electronic or physical).</li>
      </ol>

      <blockquote className="mt-4 p-4 border-l-4 border-primary-accent bg-bg-secondary/50 text-text-secondary italic">
        Note: Official DMCA agent registration is pending due to temporary U.S. Copyright Office closure. SceneIt strongly prefers email contact for all notices.
      </blockquote>

      <p className="text-text-secondary mt-4">SceneIt will review and remove infringing material promptly in compliance with the DMCA.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">6. User-Generated Content</h2>
      <p className="text-text-secondary mb-4">If you post content (such as journal entries or custom images), you grant SceneIt a license to use it in connection with operating the service. You are solely responsible for the content you post and must ensure you have the rights to use it. We do not permit uploading video or audio files.</p>
      
      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">7. Data Storage &amp; Loss</h2>
      <p className="text-text-secondary mb-4">SceneIt primarily stores your data (watch history, progress, lists, journal entries) locally in your web browser's storage. This means:</p>
      <ul>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">You are responsible for your data.</strong> Clearing your browser's cache or site data will permanently delete your SceneIt information.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Data will not automatically sync across your devices unless you use an optional cloud sync feature (like Google Drive).</li>
      </ul>
      <p className="text-text-secondary mb-4">We are not responsible for any data loss resulting from clearing browser storage or device failure. We strongly encourage you to use the available backup and sync features in the Settings menu to protect your data.</p>
      
      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">8. Termination</h2>
      <p className="text-text-secondary mb-4">We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may do so from the Settings page.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">9. Service Availability and Disclaimers</h2>
      <p className="text-text-secondary mb-4">The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the service will be uninterrupted, secure, or error-free.</p>
      <p className="text-text-secondary mb-4"><strong className="font-semibold text-text-primary">Disclaimer of Data Accuracy:</strong> The movie and TV show information provided through SceneIt is supplied by third-party APIs (such as TMDB). We do not guarantee the accuracy, completeness, or timeliness of this information and are not liable for any errors or omissions in the content.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">10. Governing Law</h2>
      <p className="text-text-secondary mb-4">These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.</p>
      
      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">11. Changes to Terms</h2>
      <p className="text-text-secondary mb-4">We may modify these terms at any time. We will notify you of any changes by posting the new Terms of Service in the app.</p>
    </div>
  );
};

export default TermsOfService;