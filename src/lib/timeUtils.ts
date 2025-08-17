import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Comprehensive time utility for consistent system time handling
 * All functions use the user's system timezone
 */

export class TimeUtils {
  /**
   * Get current system time as ISO string
   */
  static now(): string {
    return new Date().toISOString();
  }

  /**
   * Get current system time as Date object
   */
  static nowDate(): Date {
    return new Date();
  }

  /**
   * Parse any date input and ensure it's valid
   */
  static parseDate(input: string | Date | null | undefined): Date | null {
    if (!input) return null;
    
    try {
      const date = typeof input === 'string' ? parseISO(input) : input;
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  }

  /**
   * Format date for display using system timezone
   */
  static formatDisplay(input: string | Date | null | undefined, formatString: string = 'MMM d, yyyy'): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    try {
      return format(date, formatString);
    } catch {
      return '';
    }
  }

  /**
   * Format datetime for display using system timezone
   */
  static formatDateTime(input: string | Date | null | undefined, formatString: string = 'MMM d, yyyy h:mm a'): string {
    return this.formatDisplay(input, formatString);
  }

  /**
   * Format time only using system timezone
   */
  static formatTime(input: string | Date | null | undefined, formatString: string = 'h:mm a'): string {
    return this.formatDisplay(input, formatString);
  }

  /**
   * Format date only using system timezone
   */
  static formatDate(input: string | Date | null | undefined, formatString: string = 'MMM d, yyyy'): string {
    return this.formatDisplay(input, formatString);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   * Properly handles UTC timestamps from database
   */
  static formatRelative(input: string | Date | null | undefined): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    try {
      // Ensure we're comparing with current time in the same timezone context
      const now = new Date();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  }

  /**
   * Format for notifications with both absolute and relative time
   * Handles UTC timestamps properly
   */
  static formatNotificationTime(input: string | Date | null | undefined): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    try {
      // For notifications, show only relative time to avoid confusion
      return this.formatRelative(date);
    } catch {
      return '';
    }
  }

  /**
   * Create timestamp for database storage (always ISO string)
   */
  static createTimestamp(): string {
    return this.now();
  }

  /**
   * Format for local date input (YYYY-MM-DD)
   */
  static formatDateInput(input: string | Date | null | undefined): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    try {
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  }

  /**
   * Format for local time input (HH:mm)
   */
  static formatTimeInput(input: string | Date | null | undefined): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    try {
      return format(date, 'HH:mm');
    } catch {
      return '';
    }
  }

  /**
   * Check if a date is today (system timezone)
   */
  static isToday(input: string | Date | null | undefined): boolean {
    const date = this.parseDate(input);
    if (!date) return false;
    
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Check if a date is in the past (system timezone)
   */
  static isPast(input: string | Date | null | undefined): boolean {
    const date = this.parseDate(input);
    if (!date) return false;
    
    return date < new Date();
  }

  /**
   * Check if a date is in the future (system timezone)
   */
  static isFuture(input: string | Date | null | undefined): boolean {
    const date = this.parseDate(input);
    if (!date) return false;
    
    return date > new Date();
  }

  /**
   * Get timezone name of the user's system
   */
  static getSystemTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Format with explicit timezone display
   */
  static formatWithTimezone(input: string | Date | null | undefined): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    const timezone = this.getSystemTimezone();
    const formatted = this.formatDateTime(date);
    
    return `${formatted} (${timezone})`;
  }
}

/**
 * Legacy compatibility - gradually replace these with TimeUtils methods
 */
export const formatDateTimeIST = (input: string | Date): string => {
  return TimeUtils.formatDateTime(input);
};

export default TimeUtils;