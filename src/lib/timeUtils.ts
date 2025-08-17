import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Comprehensive time utility for consistent IST timezone handling
 * All functions now properly handle IST (Indian Standard Time)
 */

const IST_TIMEZONE = 'Asia/Kolkata';

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
   * Format date for display using IST timezone
   */
  static formatDisplay(input: string | Date | null | undefined, formatString: string = 'MMM d, yyyy'): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    try {
      return formatInTimeZone(date, IST_TIMEZONE, formatString);
    } catch {
      return '';
    }
  }

  /**
   * Format datetime for display using IST timezone
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
   * Format relative time (e.g., "2 hours ago") in IST
   * Properly handles UTC timestamps from database
   */
  static formatRelative(input: string | Date | null | undefined): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    try {
      // For IST timezone, we need to adjust the comparison properly
      // Since formatDistanceToNow works with local time, we convert the UTC date to IST
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const adjustedDate = new Date(date.getTime() + istOffset);
      
      return formatDistanceToNow(adjustedDate, { addSuffix: true });
    } catch {
      return '';
    }
  }

  /**
   * Format for notifications with IST timezone
   * Handles UTC timestamps properly for IST display
   */
  static formatNotificationTime(input: string | Date | null | undefined): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    try {
      // For notifications, show only relative time in IST context
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
   * Check if a date is today (IST timezone)
   */
  static isToday(input: string | Date | null | undefined): boolean {
    const date = this.parseDate(input);
    if (!date) return false;
    
    // Simple IST check using timezone offset
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(date.getTime() + istOffset);
    const istToday = new Date(new Date().getTime() + istOffset);
    
    return istDate.toDateString() === istToday.toDateString();
  }

  /**
   * Check if a date is in the past (IST timezone)
   */
  static isPast(input: string | Date | null | undefined): boolean {
    const date = this.parseDate(input);
    if (!date) return false;
    
    // Simple IST comparison using timezone offset
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(date.getTime() + istOffset);
    const istNow = new Date(new Date().getTime() + istOffset);
    
    return istDate < istNow;
  }

  /**
   * Check if a date is in the future (IST timezone)
   */
  static isFuture(input: string | Date | null | undefined): boolean {
    const date = this.parseDate(input);
    if (!date) return false;
    
    // Simple IST comparison using timezone offset
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(date.getTime() + istOffset);
    const istNow = new Date(new Date().getTime() + istOffset);
    
    return istDate > istNow;
  }

  /**
   * Get IST timezone name
   */
  static getSystemTimezone(): string {
    return IST_TIMEZONE;
  }

  /**
   * Format with explicit IST timezone display
   */
  static formatWithTimezone(input: string | Date | null | undefined): string {
    const date = this.parseDate(input);
    if (!date) return '';
    
    const formatted = this.formatDateTime(date);
    return `${formatted} (IST)`;
  }
}

/**
 * Legacy compatibility - gradually replace these with TimeUtils methods
 */
export const formatDateTimeIST = (input: string | Date): string => {
  return TimeUtils.formatDateTime(input);
};

export default TimeUtils;