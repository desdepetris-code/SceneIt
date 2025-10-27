
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import MainApp from './MainApp';
import AuthModal from './components/AuthModal';
import { UserData, WatchProgress, Theme } from './types';
import { useTheme } from './hooks/useTheme';

interface User {
  id: string;
  username: string;
  email: string;
}

interface StoredUser extends User {
  hashedPassword?: string; // This is just for simulation
}

// --- Data Migration Helper ---
const migrateGuestData = (newUserId: string) => {
    if (!confirm("You have local data as a guest. Would you like to merge it with your account? This will combine your lists and progress.")) {
        return;
    }

    const guestId = 'guest';
    const keysToMigrate = [
        'watching_list', 'plan_to_watch_list', 'completed_list', 'on_hold_list', 'dropped_list', 'favorites_list',
        'watch_progress', 'history', 'search_history', 'comments', 'custom_image_paths', 'notifications',
        'favorite_episodes', 'episode_ratings', 'custom_lists', 'user_ratings', 'profilePictureUrl'
    ];

    keysToMigrate.forEach(key => {
        const guestKey = `${key}_${guestId}`;
        const userKey = `${key}_${newUserId}`;

        const guestDataStr = localStorage.getItem(guestKey);
        if (!guestDataStr) return; // No guest data for this key.

        const userDataStr = localStorage.getItem(userKey);
        let guestData, userData;

        try {
            guestData = JSON.parse(guestDataStr);
            userData = userDataStr ? JSON.parse(userDataStr) : null;
        } catch (e) {
            console.error(`Failed to parse data for migration on key "${guestKey}". Skipping merge for this key.`, e);
            return; // Skip this key if parsing fails
        }
        
        let mergedData;

        if (!userData) {
            mergedData = guestData;
        } else {
            // Merge logic
            if (Array.isArray(userData) && Array.isArray(guestData)) {
                 const userIds = new Set(userData.map(i => i.id || i.logId || i.timestamp));
                 const uniqueGuestItems = guestData.filter(item => !userIds.has(item.id || item.logId || item.timestamp));
                 mergedData = [...uniqueGuestItems, ...userData]; // Guest items first to be older
            } else if (typeof userData === 'object' && userData !== null && typeof guestData === 'object' && guestData !== null) {
                if (key === 'watch_progress') {
                     const mergedProgress = JSON.parse(JSON.stringify(userData));
                     for (const showId in guestData) {
                         if (!mergedProgress[showId]) {
                             mergedProgress[showId] = guestData[showId];
                         } else {
                             for (const seasonNum in guestData[showId]) {
                                 if (!mergedProgress[showId][seasonNum]) {
                                     mergedProgress[showId][seasonNum] = guestData[showId][seasonNum];
                                 } else {
                                     // User episode data takes precedence
                                     mergedProgress[showId][seasonNum] = {...guestData[showId][seasonNum], ...mergedProgress[showId][seasonNum]};
                                 }
                             }
                         }
                     }
                     mergedData = mergedProgress;
                } else {
                    mergedData = { ...guestData, ...userData };
                }
            } else {
                mergedData = userData; // User data takes precedence for primitives or mismatched types
            }
        }
        localStorage.setItem(userKey, JSON.stringify(mergedData));
        localStorage.removeItem(guestKey);
    });
};


const App: React.FC = () => {
    const [customThemes] = useLocalStorage<Theme[]>('customThemes', []);
    useTheme(customThemes);

    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    
    const getUsers = (): StoredUser[] => {
        try {
            const usersJson = localStorage.getItem('sceneit_users');
            return usersJson ? JSON.parse(usersJson) : [];
        } catch (error) {
            console.error("Failed to parse users from localStorage", error);
            return [];
        }
    };

    const saveUsers = (users: StoredUser[]) => {
        localStorage.setItem('sceneit_users', JSON.stringify(users));
    };

    const handleLogin = useCallback(async ({ email, password, rememberMe }): Promise<string | null> => {
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user && user.hashedPassword === password) {
            const loggedInUser = { id: user.id, username: user.username, email: user.email };
            
            migrateGuestData(loggedInUser.id);
            setCurrentUser(loggedInUser);
            setIsAuthModalOpen(false);

            if (rememberMe) {
                localStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
            } else {
                localStorage.removeItem('rememberedUser');
            }
            return null;
        } else {
            return "Invalid email or password.";
        }
    }, [setCurrentUser]);

    const handleSignup = useCallback(async ({ username, email, password }): Promise<string | null> => {
        const users = getUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return "An account with this email already exists.";
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return "This username is already taken.";

        const newUser: StoredUser = {
            id: `user_${Date.now()}`, username, email,
            hashedPassword: password,
        };
        saveUsers([...users, newUser]);
        
        migrateGuestData(newUser.id);
        setCurrentUser({ id: newUser.id, username: newUser.username, email: newUser.email });
        setIsAuthModalOpen(false);
        return null;
    }, [setCurrentUser]);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
    }, [setCurrentUser]);

    const handleUpdatePassword = useCallback(async ({ currentPassword, newPassword }): Promise<string | null> => {
        if (!currentUser) return "No user is currently logged in.";
        
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex === -1) return "Could not find your user account.";
        const user = users[userIndex];
        
        if (user.hashedPassword !== currentPassword) return "The current password you entered is incorrect.";
        
        users[userIndex] = { ...user, hashedPassword: newPassword };
        saveUsers(users);

        try {
            const rememberedUserJson = localStorage.getItem('rememberedUser');
            if (rememberedUserJson) {
                const rememberedUser = JSON.parse(rememberedUserJson);
                if (rememberedUser.email.toLowerCase() === currentUser.email.toLowerCase()) {
                    localStorage.setItem('rememberedUser', JSON.stringify({ ...rememberedUser, password: newPassword }));
                }
            }
        } catch (error) { console.error("Failed to update remembered user password", error); }

        return null;
    }, [currentUser]);

    const userId = currentUser ? currentUser.id : 'guest';

    return (
        <>
            <MainApp
                key={userId} // Force re-mount on user change to re-initialize all local storage hooks
                userId={userId}
                currentUser={currentUser}
                onLogout={handleLogout}
                onUpdatePassword={handleUpdatePassword}
                onAuthClick={() => setIsAuthModalOpen(true)}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={handleLogin}
                onSignup={handleSignup}
            />
        </>
    );
};

export default App;