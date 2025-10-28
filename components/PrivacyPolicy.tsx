
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="prose-styles">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Privacy Policy</h1>
      <p className="text-text-secondary mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="text-text-secondary mb-4">Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use the SceneIt application ("the Service").</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">1. Information We Collect</h2>
      <p className="text-text-secondary mb-4">We collect information to provide and improve our service. This includes:</p>
      <ul>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Account Information:</strong> If you create an account, we store the username, email, and password you provide. This information is stored locally within your browser's storage.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Data You Provide:</strong> This includes journal entries, mood selections, custom list details, and any information submitted through feedback forms.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Usage Data:</strong> We automatically collect data on your interactions with the app, such as which shows you track, your watch progress (which episodes you mark as watched), and your watch history. This data is also stored locally on your device.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Analytics:</strong> We do not use any third-party analytics services like Google Analytics. All calculations for statistics are performed on your device.</li>
      </ul>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">2. How We Use Your Information</h2>
      <p className="text-text-secondary mb-4">We use the information we collect to:</p>
      <ul>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Provide, maintain, and improve the SceneIt app.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Personalize your experience, such as showing your watch progress and generating stats.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Allow you to back up and sync your data using third-party services you authorize.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc">Respond to your support requests and feedback.</li>
      </ul>
      
      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">3. Data Storage and Security</h2>
      <p className="text-text-secondary mb-4">All of your personal tracking data, including your watch lists, progress, history, and journal entries, is stored <strong className="font-semibold text-text-primary">locally on your device's browser storage</strong>. It is not transmitted to our servers unless you explicitly choose to use a cloud sync feature.</p>
      <p className="text-text-secondary mb-4">We take reasonable measures to protect your information, but no security system is impenetrable. The security of your data ultimately depends on you keeping your device and account secure.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">4. Data Sharing and Third-Party Services</h2>
      <p className="text-text-secondary mb-4">We do not sell, trade, or rent your personal data to third parties. Data is only shared with third-party services when you explicitly authorize it for features like backup and import.</p>
      <ul>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Google Drive:</strong> When you connect your Google Drive account, we request permission to access a special, sandboxed 'appDataFolder'. Our app can only access this folder and cannot see any of your other files. We use this to store a single backup file of your SceneIt data. Your Google profile information (name, email, profile picture) is used only to display your connection status within the app. We do not share this information with any other services.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">Trakt.tv:</strong> When you connect your Trakt.tv account, you authorize us to access your Trakt data based on the permissions you grant. This includes your watch history, ratings, and lists. We use this data solely for the purpose of importing it into SceneIt. We do not share your SceneIt data with Trakt.</li>
        <li className="text-text-secondary ml-6 mb-2 list-disc"><strong className="font-semibold text-text-primary">The Movie Database (TMDB):</strong> We use the TMDB API to fetch metadata (titles, posters, descriptions, etc.) about movies and TV shows. We do not send any of your personal data to TMDB.</li>
      </ul>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">5. Your Control Over Your Data</h2>
      <p className="text-text-secondary mb-4">Because your data is stored locally, you have full control over it. You can clear your data at any time through the Settings page or by clearing your browser's site data for our app. The "Download Backup" feature allows you to create a portable JSON file of your information.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">6. Children's Privacy</h2>
      <p className="text-text-secondary mb-4">Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us. If we become aware that we have collected personal data from children without verification of parental consent, we will take steps to remove that information.</p>
      
      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">7. Changes to This Policy</h2>
      <p className="text-text-secondary mb-4">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy within the app.</p>

      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">8. Contact Us</h2>
      <p className="text-text-secondary mb-4">If you have any questions about this Privacy Policy, please contact us using the feedback form in the Settings menu.</p>
    </div>
  );
};

export default PrivacyPolicy;
