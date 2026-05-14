
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuditLogger } from '@/lib/auditLogger';
import { SessionManager, initializeSessionSecurity } from '@/lib/sessionSecurity';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  firmId: string | null;
  firmError: string | null;
  role: string | null;
  isUnassigned: boolean;
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
  const [firmId, setFirmId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isUnassigned, setIsUnassigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firmError, setFirmError] = useState<string | null>(null);

  const fetchFirmIdAndRole = async (userId: string) => {
    if (!userId) {
      console.log('AuthContext: fetchFirmIdAndRole called with no userId. Setting firmId and role to undefined.');
      setFirmId(null);
      setRole(null);
      setIsUnassigned(false);
      setFirmError("No userId present.");
      return;
    }
    try {
      console.log(`AuthContext: START: Fetching firm_id and role for user: ${userId}`);
      
      // Add timeout wrapper to prevent hanging
      const fetchPromise = supabase
        .from('team_members')
        .select('firm_id, role')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 30s')), 30000)
      );
      
      const { data, error, status } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;
      
      console.log(`AuthContext: DB RESPONSE: data:`, data, `error:`, error, `status:`, status);

      if (error) {
        console.error('AuthContext: Error fetching firm_id and role:', error.message);
        setFirmId(null);
        setRole(null);
        setIsUnassigned(false);
        setFirmError(error.message || "Unknown error fetching firm_id and role.");
        console.log(`AuthContext: END (error): firm_id and role fetch failed for user: ${userId}`);
        return;
      }
      if (!data || !data.firm_id) {
        console.warn(`AuthContext: No firm_id found in team_members for user: ${userId}`);
        setFirmId(null);
        setRole(null);
        setIsUnassigned(true);
        setFirmError('No firm_id found for user.');
        console.log(`AuthContext: END (no data): No firm_id found for user: ${userId}`);
        return;
      }
      console.log('AuthContext: Firm ID and role data fetched:', data);
      setFirmId(data.firm_id);
      setRole(data.role);
      setIsUnassigned(false);
      setFirmError(null);
      console.log(`AuthContext: END (success): firm_id set to ${data.firm_id} and role set to ${data.role} for user: ${userId}`);
    } catch (e: any) {
      console.error('AuthContext: Exception fetching firm_id and role:', e.message);
      setFirmId(null);
      setRole(null);
      setIsUnassigned(false);
      setFirmError('Exception: ' + (e.message || 'Unknown'));
      console.log(`AuthContext: END (exception): firm_id and role fetch failed for user: ${userId}`);
    }
  };

  useEffect(() => {
    setLoading(true);
    console.log('AuthContext: useEffect mounting. Subscribing to onAuthStateChange and checking initial session.');

    // Timeout fallback to prevent infinite loading (reduced to 10s for better UX)
    const loadingTimeout = setTimeout(() => {
      console.warn('AuthContext: Session check timed out after 10s, forcing loading to false');
      setLoading(false);
    }, 10000);

    // 1) Subscribe to auth changes FIRST (sync callback only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('AuthContext: onAuthStateChange event:', event, 'Session:', !!currentSession);
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Defer additional Supabase calls to avoid deadlocks
        setTimeout(async () => {
          await fetchFirmIdAndRole(currentUser.id);
          initializeSessionSecurity();
        }, 0);
      } else {
        setFirmId(null);
        setRole(null);
        setIsUnassigned(false);
        setFirmError(null);
      }
    });

    // 2) THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        console.log('AuthContext: Initial session check:', !!currentSession);
        clearTimeout(loadingTimeout);

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Fetch additional data before finishing loading
          fetchFirmIdAndRole(currentUser.id).finally(() => {
            initializeSessionSecurity();
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('AuthContext: Error checking session:', error);
        clearTimeout(loadingTimeout);
        setLoading(false);
      });

    return () => {
      console.log('AuthContext: useEffect unmounting. Unsubscribing from onAuthStateChange.');
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Add timeout for sign-in to prevent hanging
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timed out. Please try again.')), 15000)
      );
      
      const { data, error } = await Promise.race([
        signInPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        // Log failed login attempt
        AuditLogger.logAuthEvent('login_failed', { 
          email: email.toLowerCase(),
          error_message: error.message 
        }).catch(() => {}); // Don't block on audit logging
        throw error;
      }
      
      if (data.user) {
        // Log successful login (don't await)
        AuditLogger.logAuthEvent('login_success', { 
          email: email.toLowerCase(),
          user_id: data.user.id 
        }).catch(() => {});
        
        // Check user role with timeout
        try {
          const rolePromise = supabase
            .from('team_members')
            .select('firm_id, role')
            .eq('user_id', data.user.id)
            .maybeSingle();
          
          const roleTimeoutPromise = new Promise((resolve) => 
            setTimeout(() => resolve({ data: null }), 5000)
          );
          
          const { data: member } = await Promise.race([
            rolePromise,
            roleTimeoutPromise
          ]) as any;
          
          if (member) {
            setFirmId(member.firm_id);
            setRole(member.role);
            setIsUnassigned(false);
            console.log('User mapped to firm:', member.firm_id, 'Role:', member.role);
            if (member.role === 'receptionist') {
              window.location.href = '/reception/home';
            } else {
              window.location.href = '/';
            }
          } else {
            setFirmId(null);
            setRole(null);
            setIsUnassigned(true);
            console.log('User not found in team_members table - marked as unassigned');
            window.location.href = '/';
          }
        } catch {
          // If role check fails, just redirect to home
          window.location.href = '/';
        }
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
      
      // Log successful signup
      if (data.user) {
        await AuditLogger.logAuthEvent('signup', { 
          email: email.toLowerCase(),
          user_id: data.user.id,
          full_name: fullName 
        });
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Log logout before clearing session
      await AuditLogger.logAuthEvent('logout');
      
      // Use secure logout from session manager
      await SessionManager.secureLogout();
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setFirmId(null);
      setRole(null);
      setIsUnassigned(false);
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even if logout fails
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    loading,
    firmId,
    role,
    isUnassigned,
    signIn,
    signUp,
    signOut,
    firmError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
