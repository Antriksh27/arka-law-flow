import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  firmId: string | undefined;
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
  const [firmId, setFirmId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFirmIdLocal = async (userId: string) => {
      if (!userId) {
        setFirmId(undefined);
        return;
      }
      try {
        console.log(`AuthContext: Fetching firm_id for user: ${userId}`);
        const { data, error } = await supabase
          .from('team_members')
          .select('firm_id')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('AuthContext: Error fetching firm_id:', error);
          setFirmId(undefined);
          return;
        }
        console.log('AuthContext: Firm ID data fetched:', data);
        setFirmId(data?.firm_id || undefined);
      } catch (e) {
        console.error('AuthContext: Exception fetching firm_id:', e);
        setFirmId(undefined);
      }
    };

    const handleAuthStateChangeLocal = async (event: string | null, currentSession: Session | null) => {
      console.log('AuthContext: onAuthStateChange event:', event, 'Session:', !!currentSession);
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchFirmIdLocal(currentUser.id);
      } else {
        setFirmId(undefined);
      }
      setLoading(false);
    };

    console.log('AuthContext: useEffect mounting. Subscribing to onAuthStateChange and calling getSession.');
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChangeLocal);

    // Check initial session state
    supabase.auth.getSession().then(async ({ data: { session: currentInitialSession } }) => {
      console.log('AuthContext: getSession resolved. Initial session:', !!currentInitialSession);
      // Only process if auth state hasn't been set by onAuthStateChange yet (user and session are still initial null)
      // This helps avoid redundant processing if onAuthStateChange(INITIAL_SESSION) fires very quickly.
      if (!user && !session) { 
        console.log('AuthContext: getSession processing. Current component user/session state is null.');
        const initialUser = currentInitialSession?.user ?? null;
        setSession(currentInitialSession);
        setUser(initialUser);

        if (initialUser) {
          await fetchFirmIdLocal(initialUser.id);
        } else {
          setFirmId(undefined);
        }
      }
      // Ensure loading is set to false after initial check.
      // onAuthStateChange also sets loading to false. This covers cases where onAuthStateChange might not fire for an empty initial session.
      setLoading(false); 
    }).catch(error => {
      console.error("AuthContext: Error in getSession:", error);
      setLoading(false); 
    });

    return () => {
      console.log('AuthContext: useEffect unmounting. Unsubscribing from onAuthStateChange.');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array: ensures this effect runs only on mount and unmount

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
    firmId,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
