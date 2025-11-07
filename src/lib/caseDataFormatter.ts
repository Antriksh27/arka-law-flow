import { TimeUtils } from './timeUtils';

/**
 * Utility functions for formatting case data
 */

/**
 * Format date from ISO to DD/MM/YYYY for display
 */
export function formatDateDisplay(isoDate: string | null | undefined): string {
  if (!isoDate) return '-';
  return TimeUtils.formatDate(isoDate) || '-';
}

/**
 * Format date from ISO to readable format like "7th November 2025"
 */
export function formatDateLong(isoDate: string | null | undefined): string {
  if (!isoDate) return '-';
  
  try {
    const formatted = TimeUtils.formatDisplay(isoDate, 'do MMMM yyyy');
    return formatted || '-';
  } catch {
    return '-';
  }
}

/**
 * Clean and format advocate name
 */
export function formatAdvocateName(advocate: string | null | undefined): string {
  if (!advocate) return 'Not specified';
  return advocate.trim();
}

/**
 * Format party name with title case
 */
export function formatPartyName(name: string | null | undefined): string {
  if (!name) return '-';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
