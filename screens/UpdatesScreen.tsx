import React from 'react';

interface Update {
  version: string;
  changes: {
    type: 'New' | 'Improved' | 'Fixed';
    description: string;
  }[];
}

const updates: Update[] = [
  {
    version: 'v1.7.0',
    changes: [
      { type: 'New', description: 'Added notification toggles for "App Updates" and "Import/Sync Completed" in settings.' },
      { type: 'Improved', description: '"On Hold" items are now moved to the bottom of the Progress screen and removed from Continue Watching.' },
      { type: 'Improved', description: '"Dropped" items are now completely hidden from the Progress and Continue Watching sections.' },
      { type: 'Improved', description: 'Profile tab icons have been updated to a cleaner, outline style for better visibility.' },
      { type: 'New', description: 'The "Updates" tab in the profile now has a unique "Megaphone" icon to distinguish it from recommendations.' },
    ],
  },
  {
    version: 'v1.6.0',
    changes: [
      { type: 'New', description: 'Added a "Forgot Password" flow to the reset password modal in settings.' },
      { type: 'Improved', description: 'Data management buttons in Settings now check for existing data before running and provide clearer feedback.' },
      { type: 'Fixed', description: 'The "Unmark Season Watched" button now correctly unmarks all episodes in a season.' },
      { type: 'Fixed', description: 'The "Clear All History" button on show/movie pages now provides a success confirmation message.' },
    ],
  },
  {
    version: 'v1.5.0',
    changes: [
      { type: 'New', description: 'Introducing the Updates Tab! You can now see a log of all recent changes right here in the app.' },
      { type: 'New', description: 'Added a "Season Log" to your profile to see all the seasons you\'ve completed in one place.' },
      { type: 'Improved', description: 'Data management buttons in Settings now have clearer confirmation messages to prevent accidental data loss.' },
      { type: 'Fixed', description: 'Resolved an issue where clearing your entire watch history would sometimes require two confirmations.' },
    ],
  },
  {
    version: 'v1.4.2',
    changes: [
      { type: 'New', description: 'You can now create and manage your own Custom Lists from the Profile page.' },
      { type: 'Improved', description: 'The search results dropdown now includes quick actions to mark items as watched or add them to your lists.' },
      { type: 'Improved', description: 'Enhanced the theme engine. You can now create your own themes with patterns and solid colors in Settings.' },
      { type: 'Fixed', description: 'Fixed a bug that caused the app to crash when importing certain types of CSV files.' },
    ],
  },
];

const UpdateCard: React.FC<{ update: Update }> = ({ update }) => {
  const typeStyles = {
    New: 'bg-sky-500/20 text-sky-300',
    Improved: 'bg-green-500/20 text-green-300',
    Fixed: 'bg-red-500/20 text-red-300',
  };

  return (
    <div className="bg-card-gradient rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold text-text-primary mb-3">{update.version}</h3>
      <ul className="space-y-3">
        {update.changes.map((change, index) => (
          <li key={index} className="flex items-start">
            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mr-3 mt-1 ${typeStyles[change.type]}`}>
              {change.type}
            </span>
            <p className="text-text-secondary">{change.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const UpdatesScreen: React.FC = () => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">App Updates</h1>
        <p className="text-text-secondary mt-1">Here's a look at the latest features, improvements, and bug fixes.</p>
      </header>
      
      <div>
        {updates.map(update => (
          <UpdateCard key={update.version} update={update} />
        ))}
      </div>
    </div>
  );
};

export default UpdatesScreen;