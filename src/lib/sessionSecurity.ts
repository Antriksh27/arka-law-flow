/**
 * Session security management utilities
 */

import { supabase } from '@/integrations/supabase/client';

export class SessionManager {
  private static instance: SessionManager;
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
  private readonly WARNING_TIME = 5 * 60 * 1000; // 5 minutes before logout
  private lastActivity: number = Date.now();

  private constructor() {
    this.startInactivityMonitor();
    this.bindActivityListeners();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Clean up all authentication state from storage
   */
  public static cleanupAuthState(): void {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Perform secure logout with cleanup
   */
  public static async secureLogout(): Promise<void> {
    try {
      // Clean up auth state first
      SessionManager.cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Sign out failed, but state cleaned up:', err);
      }
      
      // Force page reload for complete clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/auth';
    }
  }

  /**
   * Start monitoring user inactivity
   */
  private startInactivityMonitor(): void {
    this.resetInactivityTimer();
  }

  /**
   * Bind event listeners for user activity
   */
  private bindActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity.bind(this), true);
    });
  }

  /**
   * Handle user activity events
   */
  private handleUserActivity(): void {
    this.lastActivity = Date.now();
    this.resetInactivityTimer();
  }

  /**
   * Reset the inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    // Set warning timer (5 minutes before logout)
    this.inactivityTimeout = setTimeout(() => {
      this.showInactivityWarning();
    }, this.INACTIVITY_LIMIT - this.WARNING_TIME);
  }

  /**
   * Show inactivity warning to user
   */
  private showInactivityWarning(): void {
    const timeUntilLogout = Math.ceil(this.WARNING_TIME / 1000 / 60); // minutes
    
    if (confirm(`You will be logged out in ${timeUntilLogout} minutes due to inactivity. Click OK to stay logged in.`)) {
      // User chose to stay active
      this.handleUserActivity();
    } else {
      // Auto logout after warning period
      setTimeout(() => {
        SessionManager.secureLogout();
      }, this.WARNING_TIME);
    }
  }

  /**
   * Check if session is expired based on inactivity
   */
  public isSessionExpired(): boolean {
    return Date.now() - this.lastActivity > this.INACTIVITY_LIMIT;
  }

  /**
   * Get remaining session time in milliseconds
   */
  public getRemainingSessionTime(): number {
    return Math.max(0, this.INACTIVITY_LIMIT - (Date.now() - this.lastActivity));
  }

  /**
   * Destroy the session manager
   */
  public destroy(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity.bind(this), true);
    });
  }
}

/**
 * Initialize session security when user is authenticated
 */
export const initializeSessionSecurity = (): SessionManager => {
  return SessionManager.getInstance();
};

/**
 * Enhanced sign-in with security cleanup
 */
export const secureSignIn = async (email: string, password: string) => {
  try {
    // Clean up existing state first
    SessionManager.cleanupAuthState();
    
    // Attempt global sign out to clear any existing sessions
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Continue even if this fails
    }

    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Initialize session security
      initializeSessionSecurity();
      
      // Force page reload for clean state
      window.location.href = '/';
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Enhanced sign-up with security features
 */
export const secureSignUp = async (email: string, password: string, fullName: string) => {
  try {
    // Clean up existing state first
    SessionManager.cleanupAuthState();

    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};