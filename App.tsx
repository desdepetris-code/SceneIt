
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MainApp } from './MainApp';
import AuthModal from './components/AuthModal';
import { UserData, WatchProgress, Theme } from './types';
import { confirmationService } from './services/confirmationService';
import { supabase } from './services/supabaseClient';

interface User {
  id: string;
  username: string;
  email: string;
}

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const userId = currentUser ? currentUser.id : 'guest';

    const [autoHolidayThemesEnabled, setAutoHolidayThemesEnabled] = useLocalStorage<boolean>(`autoHolidayThemesEnabled_${userId}`, true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        // Handle Supabase Auth State
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setCurrentUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User'
                });
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setCurrentUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User'
                });
            } else {
                setCurrentUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = useCallback(async ({ email, password }): Promise<string | null> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return error.message;
        setIsAuthModalOpen(false);
        return null;
    }, []);

    const handleSignup = useCallback(async ({ username, email, password }): Promise<string | null> => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        });
        if (error) return error.message;
        
        // Profiles are usually handled by a trigger, but we ensure one exists
        // (RLS allows owner insert)
        await supabase.from('profiles').insert([{ id: (await supabase.auth.getUser()).data.user?.id, username, user_xp: 0 }]);
        
        setIsAuthModalOpen(false);
        confirmationService.show(`Welcome to CineMontauge! Please check your email for a confirmation link.`);
        return null;
    }, []);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    }, []);

    const handleForgotPasswordRequest = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return error ? error.message : null;
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest animate-pulse">Initializing Backend...</div>;
    
    return (
        <>
            <MainApp
                key={userId}
                userId={userId}
                currentUser={currentUser}
                onLogout={handleLogout}
                onUpdatePassword={() => Promise.resolve(null)}
                onUpdateProfile={() => Promise.resolve(null)}
                onAuthClick={() => setIsAuthModalOpen(true)}
                onForgotPasswordRequest={handleForgotPasswordRequest}
                onForgotPasswordReset={() => Promise.resolve(null)}
                autoHolidayThemesEnabled={autoHolidayThemesEnabled}
                setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={handleLogin}
                onSignup={handleSignup}
                onForgotPasswordRequest={handleForgotPasswordRequest}
                onForgotPasswordReset={() => Promise.resolve(null)}
            />
        </>
    );
};

export default App;
