import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface ClientData {
  id: string;
  full_name: string;
}

interface ClientAuthContextType {
  user: User | null;
  client: ClientData | null;
  session: Session | null;
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const ClientAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch client data
          const { data: clientUser } = await supabase
            .from('client_users')
            .select('client_id, clients(id, full_name)')
            .eq('auth_user_id', currentSession.user.id)
            .single();
          
          if (clientUser && clientUser.clients) {
            setClient(clientUser.clients as ClientData);
          }
        }
      } catch (error) {
        console.error('Error initializing client auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          const { data: clientUser } = await supabase
            .from('client_users')
            .select('client_id, clients(id, full_name)')
            .eq('auth_user_id', newSession.user.id)
            .single();
          
          if (clientUser && clientUser.clients) {
            setClient(clientUser.clients as ClientData);
          }
        } else {
          setClient(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPhone = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('client-otp', {
        body: { action: 'sign-in', phone },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      if (data.error) {
        console.error('Sign-in error:', data.error);
        return { success: false, error: data.error };
      }

      // Set the session manually
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        setUser(data.user);
        setSession(data.session);
        setClient(data.client);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Sign-in exception:', error);
      return { success: false, error: error.message || 'Failed to sign in' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClient(null);
    setSession(null);
  };

  return (
    <ClientAuthContext.Provider
      value={{
        user,
        client,
        session,
        loading,
        signInWithPhone,
        signOut,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};