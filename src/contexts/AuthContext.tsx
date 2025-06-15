import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  firmId: string | undefined;
  firmError: string | null;
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
  const [firmError, setFirmError] = useState<string | null>(null);

  const fetchFirmIdLocal = async (userId: string) => {
    if (!userId) {
      console.log('AuthContext: fetchFirmIdLocal called with no userId. Setting firmId to undefined.');
      setFirmId(undefined);
      setFirmError("No userId present.");
      return;
    }
    try {
      console.log(`AuthContext: START: Fetching firm_id for user: ${userId}`);
      const { data, error, status } = await supabase
        .from('team_members')
        .select('firm_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log(`AuthContext: DB RESPONSE: data:`, data, `error:`, error, `status:`, status);

      if (error) {
        console.error('AuthContext: Error fetching firm_id:', error.message);
        setFirmId(undefined);
        setFirmError(error.message || "Unknown error fetching firm_id.");
        console.log(`AuthContext: END (error): firm_id fetch failed for user: ${userId}`);
        return;
      }
      if (!data || !data.firm_id) {
        console.warn(`AuthContext: No firm_id found in team_members for user: ${userId}`);
        setFirmId(undefined);
        setFirmError('No firm_id found for user.');
        console.log(`AuthContext: END (no data): No firm_id found for user: ${userId}`);
        return;
      }
      console.log('AuthContext: Firm ID data fetched:', data);
      setFirmId(data.firm_id);
      setFirmError(null);
      console.log(`AuthContext: END (success): firm_id set to ${data.firm_id} for user: ${userId}`);
    } catch (e: any) {
      console.error('AuthContext: Exception fetching firm_id:', e.message);
      setFirmId(undefined);
      setFirmError('Exception: ' + (e.message || 'Unknown'));
      console.log(`AuthContext: END (exception): firm_id fetch failed for user: ${userId}`);
    }
  };

  useEffect(() => {
    setLoading(true);
    console.log('AuthContext: useEffect mounting. Subscribing to onAuthStateChange.');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('AuthContext: onAuthStateChange event:', event, 'Session:', !!currentSession);
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log(`AuthContext: User (id: ${currentUser.id}) present in onAuthStateChange. Fetching firm_id.`);
          setTimeout(async () => {
            await fetchFirmIdLocal(currentUser.id);
            setLoading(false);
          }, 0);
        } else {
          setFirmId(undefined);
          setFirmError(null);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('AuthContext: useEffect unmounting. Unsubscribing from onAuthStateChange.');
      subscription.unsubscribe();
    };
  }, []);

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
    firmError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
