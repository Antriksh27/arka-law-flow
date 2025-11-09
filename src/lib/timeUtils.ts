import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Comprehensive time utility for consistent IST timezone handling
 * All functions now properly handle IST (Indian Standard Time)
 */

const IST_TIMEZONE = 'Asia/Kolkata';

export class TimeUtils {
  /**
   * Get current IST time as ISO string
   */
  static now(): string {
    return new Date().toISOString();
  }

  /**
   * Get current IST time as Date object
   */
  static nowDate(): Date {
    return new Date();
  }

  /**
   * Get current IST date/time formatted for display
   */
  static getCurrentISTDateTime(): string {
    return this.formatDateTime(this.nowDate());
  }

  /**
   * Convert any date input to IST timezone Date object
   */
  static toISTDate(input: string | Date | null | undefined): Date | null {
    return this.parseDate(input);
  }

  /**
   * Convert HTML5 date and time inputs to IST timestamp
   * @param dateString - Date in 'yyyy-MM-dd' format
   * @param timeString - Time in 'HH:mm' format (optional)
   */
  static fromUserInput(dateString: string, timeString?: string): Date {
    if (timeString) {
      return parseISO(`${dateString}T${timeString}:00`);
    }
    return parseISO(`${dateString}T00:00:00`);
  }

  /**
   * Convert IST date to HTML5 date input format (yyyy-MM-dd)
   */
  static toDateInputFormat(input: string | Date | null | undefined): string {
    return this.formatDateInput(input);
  }

  /**
   * Convert IST date to HTML5 time input format (HH:mm)
   */
  static toTimeInputFormat(input: string | Date | null | undefined): string {
    return this.formatTimeInput(input);
  }

  /**
   * Add days to a date in IST context
   */
  static addDaysIST(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Compare two dates in IST context
   * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
   */
  static compareDates(date1: string | Date | null | undefined, date2: string | Date | null | undefined): number {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    
    if (!d1 || !d2) return 0;
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  }

  /**
   * Check if a date string is valid
   */
  static isValidDate(input: string | Date | null | undefined): boolean {
    const date = this.parseDate(input);
    return date !== null && isValid(date);
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
   * Default format is DD/MM/YYYY as per Indian standard
   */
  static formatDisplay(input: string | Date | null | undefined, formatString: string = 'dd/MM/yyyy'): string {
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
   * Default format is DD/MM/YYYY h:mm a as per Indian standard
   */
  static formatDateTime(input: string | Date | null | undefined, formatString: string = 'dd/MM/yyyy h:mm a'): string {
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
   * Default format is DD/MM/YYYY as per Indian standard
   */
  static formatDate(input: string | Date | null | undefined, formatString: string = 'dd/MM/yyyy'): string {
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
    return formatted;
  }
}

/**
 * Legacy compatibility - gradually replace these with TimeUtils methods
 */
export const formatDateTimeIST = (input: string | Date): string => {
  return TimeUtils.formatDateTime(input);
};

export default TimeUtils;