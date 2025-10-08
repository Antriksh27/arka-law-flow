/**
 * Utility functions for formatting case data
 */

/**
 * Format date from ISO to DD-MM-YYYY for display
 */
export function formatDateDisplay(isoDate: string | null | undefined): string {
  if (!isoDate) return '-';
  
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Format date from ISO to readable format like "7th November 2025"
 */
export function formatDateLong(isoDate: string | null | undefined): string {
  if (!isoDate) return '-';
  
  try {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    // Add ordinal suffix
    const suffix = ['th', 'st', 'nd', 'rd'][
      day % 10 > 3 || Math.floor((day % 100) / 10) === 1 ? 0 : day % 10
    ];
    
    return `${day}${suffix} ${month} ${year}`;
  } catch {
    return isoDate;
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
