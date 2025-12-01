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
    // Only initialize if on client portal routes
    const isClientRoute = window.location.pathname.startsWith('/client');
    if (!isClientRoute) {
      setLoading(false);
      return;
    }

    // Check active session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          // Check if this is actually a lawyer user (shouldn't be using client portal)
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();
          
          if (teamMember) {
            console.log('ClientAuthContext: User is a team member, not a client');
            setLoading(false);
            return;
          }
          
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch client data with error handling
          try {
            const { data: clientUser, error } = await supabase
              .from('client_users')
              .select('client_id, clients(id, full_name)')
              .eq('auth_user_id', currentSession.user.id)
              .maybeSingle();
            
            if (error) {
              console.warn('ClientAuthContext: Error fetching client data:', error);
            } else if (clientUser && clientUser.clients) {
              setClient(clientUser.clients as ClientData);
            }
          } catch (clientError) {
            console.warn('ClientAuthContext: Failed to fetch client data:', clientError);
          }
        }
      } catch (error) {
        console.error('Error initializing client auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (sync callback only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Defer client data fetch to avoid deadlock
        if (newSession?.user) {
          setTimeout(async () => {
            try {
              // Check if this is actually a lawyer user
              const { data: teamMember } = await supabase
                .from('team_members')
                .select('id')
                .eq('user_id', newSession.user.id)
                .maybeSingle();
              
              if (teamMember) {
                console.log('ClientAuthContext: User is a team member, not a client');
                setLoading(false);
                return;
              }
              
              const { data: clientUser, error } = await supabase
                .from('client_users')
                .select('client_id, clients(id, full_name)')
                .eq('auth_user_id', newSession.user.id)
                .maybeSingle();
              
              if (error) {
                console.warn('ClientAuthContext: Error fetching client data on auth change:', error);
              } else if (clientUser && clientUser.clients) {
                setClient(clientUser.clients as ClientData);
              }
            } catch (clientError) {
              console.warn('ClientAuthContext: Failed to fetch client data on auth change:', clientError);
            }
          }, 0);
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
        return { success: false, error: error.message };
      }

      if (data.error) {
        return { success: false, error: data.error };
      }

      // Session will be automatically set by onAuthStateChange
      return { success: true };
    } catch (error: any) {
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