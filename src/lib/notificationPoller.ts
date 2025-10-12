/**
 * Notification Polling Fallback
 * Used when realtime connections fail or as a backup mechanism
 */

import { supabase } from '@/integrations/supabase/client';

export interface NotificationPollerOptions {
  userId: string;
  interval?: number; // in milliseconds
  onNewNotifications?: (count: number) => void;
  onError?: (error: Error) => void;
}

export class NotificationPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheckTime: Date;
  private options: Required<NotificationPollerOptions>;
  private isRunning = false;

  constructor(options: NotificationPollerOptions) {
    this.options = {
      interval: 30000, // Default: 30 seconds
      onNewNotifications: () => {},
      onError: () => {},
      ...options,
    };
    this.lastCheckTime = new Date();
  }

  /**
   * Start polling for new notifications
   */
  start(): void {
    if (this.isRunning) {
      console.log('📊 Notification poller already running');
      return;
    }

    console.log(`📊 Starting notification poller (interval: ${this.options.interval}ms)`);
    this.isRunning = true;
    
    // Do an immediate check
    this.checkForNewNotifications();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkForNewNotifications();
    }, this.options.interval);
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.intervalId) {
      console.log('📊 Stopping notification poller');
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
    }
  }

  /**
   * Check for new notifications since last check
   */
  private async checkForNewNotifications(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, created_at', { count: 'exact' })
        .eq('recipient_id', this.options.userId)
        .gt('created_at', this.lastCheckTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const newCount = data?.length || 0;
      
      if (newCount > 0) {
        console.log(`📊 Poller found ${newCount} new notifications`);
        this.options.onNewNotifications(newCount);
        
        // Update last check time to the most recent notification
        if (data && data.length > 0) {
          this.lastCheckTime = new Date(data[0].created_at);
        }
      }
    } catch (error) {
      console.error('📊 Notification poller error:', error);
      this.options.onError(error as Error);
    }
  }

  /**
   * Update the polling interval
   */
  setInterval(interval: number): void {
    this.options.interval = interval;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current polling status
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Force an immediate check
   */
  async checkNow(): Promise<void> {
    await this.checkForNewNotifications();
  }
}

/**
 * Hook-friendly poller manager
 */
export class NotificationPollerManager {
  private static pollers = new Map<string, NotificationPoller>();

  static getOrCreate(options: NotificationPollerOptions): NotificationPoller {
    const key = options.userId;
    
    if (!this.pollers.has(key)) {
      this.pollers.set(key, new NotificationPoller(options));
    }
    
    return this.pollers.get(key)!;
  }

  static remove(userId: string): void {
    const poller = this.pollers.get(userId);
    if (poller) {
      poller.stop();
      this.pollers.delete(userId);
    }
  }

  static stopAll(): void {
    this.pollers.forEach(poller => poller.stop());
    this.pollers.clear();
  }
}

export default NotificationPoller;
