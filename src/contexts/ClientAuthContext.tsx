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
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
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

  const sendOtp = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('client-otp', {
        body: { action: 'send-otp', phone },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to send OTP' };
    }
  };

  const verifyOtp = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('client-otp', {
        body: { action: 'verify-otp', phone, token: otp },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      // Session will be automatically set by onAuthStateChange
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to verify OTP' };
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
        sendOtp,
        verifyOtp,
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