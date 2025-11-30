
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuditLogger } from '@/lib/auditLogger';
import { SessionManager, initializeSessionSecurity } from '@/lib/sessionSecurity';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  firmId: string | undefined;
  firmError: string | null;
  role: string | null;
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
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [firmError, setFirmError] = useState<string | null>(null);

  const fetchFirmIdAndRole = async (userId: string) => {
    if (!userId) {
      console.log('AuthContext: fetchFirmIdAndRole called with no userId. Setting firmId and role to undefined.');
      setFirmId(undefined);
      setRole(null);
      setFirmError("No userId present.");
      return;
    }
    try {
      console.log(`AuthContext: START: Fetching firm_id and role for user: ${userId}`);
      
      // Retry logic with exponential backoff
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Fetch attempt ${attempt}/${maxRetries}`);
          
          const fetchPromise = supabase
            .from('team_members')
            .select('firm_id, role')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout after 8s')), 8000)
          );
          
          const { data, error, status } = await Promise.race([
            fetchPromise,
            timeoutPromise
          ]) as any;
          
          console.log(`AuthContext: DB RESPONSE attempt ${attempt}:`, data, `error:`, error, `status:`, status);

          if (error) {
            throw error;
          }
          
          if (!data || !data.firm_id) {
            console.warn(`AuthContext: No firm_id found in team_members for user: ${userId}`);
            setFirmId(undefined);
            setRole(null);
            setFirmError('No firm_id found for user.');
            console.log(`AuthContext: END (no data): No firm_id found for user: ${userId}`);
            return;
          }
          
          console.log('✅ Firm ID and role data fetched successfully:', data);
          setFirmId(data.firm_id);
          setRole(data.role);
          setFirmError(null);
          console.log(`AuthContext: END (success): firm_id set to ${data.firm_id} and role set to ${data.role} for user: ${userId}`);
          return; // Success, exit retry loop
          
        } catch (retryError: any) {
          lastError = retryError;
          console.warn(`❌ Attempt ${attempt} failed:`, retryError.message);
          
          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // All retries failed
      throw lastError || new Error('All retry attempts failed');
      
    } catch (e: any) {
      console.error('❌ AuthContext: All attempts to fetch firm_id and role failed:', e.message);
      setFirmId(undefined);
      setRole(null);
      setFirmError('Database connection error. Please check your internet connection and try again.');
      console.log(`AuthContext: END (exception): firm_id and role fetch failed for user: ${userId}`);
    }
  };

  useEffect(() => {
    setLoading(true);
    console.log('AuthContext: useEffect mounting. Subscribing to onAuthStateChange and checking initial session.');

    // Timeout fallback to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('AuthContext: Session check timed out after 5s, stopping loading state');
      setLoading(false);
    }, 5000);

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
        setFirmId(undefined);
        setRole(null);
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
          // Defer fetch to avoid doing async work directly here
          setTimeout(async () => {
            await fetchFirmIdAndRole(currentUser.id);
            initializeSessionSecurity();
          }, 0);
        } else {
          setFirmId(undefined);
          setRole(null);
          setFirmError(null);
        }

        setLoading(false);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Log failed login attempt
        await AuditLogger.logAuthEvent('login_failed', { 
          email: email.toLowerCase(),
          error_message: error.message 
        });
        throw error;
      }
      
      if (data.user) {
        // Log successful login
        await AuditLogger.logAuthEvent('login_success', { 
          email: email.toLowerCase(),
          user_id: data.user.id 
        });
        
        // Check user role and redirect accordingly
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('role')
          .eq('user_id', data.user.id)
          .single();
        
        if (teamMember?.role === 'receptionist') {
          window.location.href = '/reception/home';
        } else {
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
      setFirmId(undefined);
      setRole(null);
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
    signIn,
    signUp,
    signOut,
    firmError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
