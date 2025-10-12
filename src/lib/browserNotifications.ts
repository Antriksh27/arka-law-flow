/**
 * Browser Notifications Utility
 * Handles native browser notifications with permission management
 */

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class BrowserNotifications {
  private static hasPermission = false;
  private static isSupported = 'Notification' in window;

  /**
   * Check if browser notifications are supported
   */
  static isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Browser notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      
      // Save preference
      localStorage.setItem('browser-notifications-requested', 'true');
      localStorage.setItem('browser-notifications-permission', permission);
      
      console.log('🔔 Browser notification permission:', permission);
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if we should request permission
   * (not already requested and not denied)
   */
  static shouldRequestPermission(): boolean {
    if (!this.isSupported) return false;
    
    const alreadyRequested = localStorage.getItem('browser-notifications-requested') === 'true';
    const permission = this.getPermission();
    
    return !alreadyRequested && permission === 'default';
  }

  /**
   * Show a browser notification
   */
  static async show(options: BrowserNotificationOptions): Promise<Notification | null> {
    if (!this.isSupported) {
      console.warn('Browser notifications not supported');
      return null;
    }

    // Check permission
    if (this.getPermission() !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/lovable-uploads/89ea18cf-8c73-4793-9dcc-1a192855a630.png',
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
        silent: options.silent ?? false,
        data: options.data,
      });

      // Auto-close after 10 seconds if not require interaction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      // Handle click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigate to action URL if provided
        if (options.data?.action_url) {
          window.location.href = options.data.action_url;
        }
        
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show notification for specific category
   */
  static async showCategoryNotification(
    category: string,
    title: string,
    message: string,
    actionUrl?: string,
    priority?: string
  ): Promise<Notification | null> {
    const categoryIcons: Record<string, string> = {
      case: '⚖️',
      hearing: '👨‍⚖️',
      task: '📋',
      appointment: '📅',
      document: '📄',
      invoice: '💰',
      message: '💬',
      system: '⚙️',
    };

    const icon = categoryIcons[category] || '🔔';
    
    return this.show({
      title: `${icon} ${title}`,
      body: message,
      tag: category,
      requireInteraction: priority === 'urgent' || priority === 'high',
      data: {
        category,
        action_url: actionUrl,
        priority,
      },
    });
  }

  /**
   * Test browser notifications
   */
  static async test(): Promise<boolean> {
    if (!this.isSupported) return false;

    if (this.getPermission() !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    const notification = await this.show({
      title: '🔔 Test Notification',
      body: 'Browser notifications are working!',
      requireInteraction: false,
    });

    return notification !== null;
  }

  /**
   * Clear all notifications with a specific tag
   */
  static async clearByTag(tag: string): Promise<void> {
    if (!this.isSupported) return;

    try {
      // This only works if Service Worker is registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({ tag });
        notifications.forEach(notification => notification.close());
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

export default BrowserNotifications;
