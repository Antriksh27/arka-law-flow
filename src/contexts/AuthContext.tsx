import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  firmId: string | undefined; // Added firmId
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [firmId, setFirmId] = useState<string | undefined>(undefined); // Added firmId state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFirmId = async (userId: string) => {
      if (!userId) {
        setFirmId(undefined);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('firm_id')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching firm_id:', error);
          setFirmId(undefined);
          return;
        }
        setFirmId(data?.firm_id || undefined);
      } catch (e) {
        console.error('Exception fetching firm_id:', e);
        setFirmId(undefined);
      }
    };

    const handleAuthStateChange = async (event: string | null, currentSession: Session | null) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchFirmId(currentUser.id);
      } else {
        setFirmId(undefined);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      // This check is important to avoid race conditions with onAuthStateChange
      // Only set initial state if the listener hasn't already run for the initial load
      if (!session && !user) { // Check if state hasn't been set by onAuthStateChange yet
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchFirmId(currentUser.id);
        } else {
          setFirmId(undefined);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session, user]); // Added dependencies to re-evaluate if session/user changes from other means, though unlikely

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Force page reload for clean state. This will trigger the useEffect above.
        window.location.href = '/';
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // IMPORTANT: Add emailRedirectTo for Supabase email confirmation
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
      
      // Note: After sign-up, the user usually needs to confirm their email.
      // The onAuthStateChange listener will handle setting the user and firmId
      // once they log in after confirmation.
      // If auto-confirmation is enabled in Supabase, they might be logged in directly.
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setFirmId(undefined);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    firmId, // Added firmId to context value
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
