export const formatDateTimeIST = (input: string | Date): string => {
  try {
    const date = typeof input === 'string' ? new Date(input) : input;
    if (!date || isNaN(date.getTime())) return '';

    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${formatter.format(date)} IST`;
  } catch (e) {
    return '';
  }
};
