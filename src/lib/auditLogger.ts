/**
 * Audit logging system for security monitoring
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  entity_type: string;
  action: string;
  entity_id?: string;
  user_id?: string;
  details?: Record<string, any>;
}

/**
 * Logs security and business events for audit purposes
 */
export class AuditLogger {
  /**
   * Log authentication events
   */
  static async logAuthEvent(action: 'login_success' | 'login_failed' | 'logout' | 'signup', details?: Record<string, any>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('audit_logs').insert({
        entity_type: 'authentication',
        action,
        user_id: user?.id || null,
        details: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: 'client_side', // Will be captured by server
          ...details
        }
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  /**
   * Log data access events
   */
  static async logDataAccess(entity_type: string, action: 'view' | 'create' | 'update' | 'delete', entity_id?: string, details?: Record<string, any>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return; // Don't log for anonymous users
      
      await supabase.from('audit_logs').insert({
        entity_type,
        action,
        entity_id,
        user_id: user.id,
        details: {
          timestamp: new Date().toISOString(),
          ...details
        }
      });
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(action: string, details?: Record<string, any>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('audit_logs').insert({
        entity_type: 'security',
        action,
        user_id: user?.id || null,
        details: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ...details
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(action: string, entity_type: string, entity_id?: string, details?: Record<string, any>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      await supabase.from('audit_logs').insert({
        entity_type,
        action: `admin_${action}`,
        entity_id,
        user_id: user.id,
        details: {
          timestamp: new Date().toISOString(),
          admin_action: true,
          ...details
        }
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }
}

/**
 * Hook for easy audit logging in React components
 */
export const useAuditLogger = () => {
  return {
    logAuthEvent: AuditLogger.logAuthEvent,
    logDataAccess: AuditLogger.logDataAccess,
    logSecurityEvent: AuditLogger.logSecurityEvent,
    logAdminAction: AuditLogger.logAdminAction,
  };
};