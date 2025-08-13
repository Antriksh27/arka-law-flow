import TimeUtils from './timeUtils';

/**
 * @deprecated Use TimeUtils.formatDateTime() instead for system timezone support
 * This function is kept for backward compatibility but will display in system timezone
 */
export const formatDateTimeIST = (input: string | Date): string => {
  return TimeUtils.formatDateTime(input);
};
