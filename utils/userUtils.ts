
import { PublicUser, PublicCustomList, CustomList } from '../types';

interface StoredUser {
  id: string;
  username: string;
  email: string;
  hashedPassword?: string;
}

export const getAllUsers = (): StoredUser[] => {
    try {
        const usersJson = localStorage.getItem('sceneit_users');
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
        console.error("Failed to parse users from localStorage", error);
        return [];
    }
};

export const searchUsers = (query: string, currentUserId: string | null): PublicUser[] => {
    if (!query) return [];
    const allUsers = getAllUsers();
    const lowerCaseQuery = query.toLowerCase();
    
    return allUsers
        .filter(user => user.id !== currentUserId && user.username.toLowerCase().includes(lowerCaseQuery))
        .map(user => {
            const profilePictureUrl = localStorage.getItem(`profilePictureUrl_${user.id}`);
            let parsedUrl: string | null = null;
            if (profilePictureUrl) {
                try {
                    parsedUrl = JSON.parse(profilePictureUrl);
                } catch (e) {
                    console.warn(`Could not parse profile picture URL for user ${user.id}. Value:`, profilePictureUrl, e);
                    // Fallback for potentially raw string values from older app versions or corruption
                    if (typeof profilePictureUrl === 'string' && (profilePictureUrl.startsWith('http') || profilePictureUrl.startsWith('data:'))) {
                        parsedUrl = profilePictureUrl;
                    }
                }
            }
            return {
                id: user.id,
                username: user.username,
                profilePictureUrl: parsedUrl
            };
        });
};

export const searchPublicLists = (query: string, currentUserId: string | null): PublicCustomList[] => {
    if (!query) return [];
    const allUsers = getAllUsers();
    const lowerCaseQuery = query.toLowerCase();
    let results: PublicCustomList[] = [];

    allUsers.forEach(user => {
        if (user.id === currentUserId) return;
        
        try {
            const listsJson = localStorage.getItem(`custom_lists_${user.id}`);
            if (listsJson) {
                const lists: CustomList[] = JSON.parse(listsJson);
                const matchingLists = lists
                    .filter(list => list.isPublic && list.name.toLowerCase().includes(lowerCaseQuery))
                    .map(list => ({
                        ...list,
                        user: { id: user.id, username: user.username }
                    }));
                results = [...results, ...matchingLists];
            }
        } catch (error) {
            console.error(`Failed to parse lists for user ${user.id}`, error);
        }
    });

    return results;
};