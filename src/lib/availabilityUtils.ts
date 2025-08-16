import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isSameDay } from 'date-fns';

interface BlockedDate {
  date: string;
  reason: string | null;
  source: 'individual' | 'firm_holiday';
  is_blocked: boolean;
}

/**
 * Get all blocked dates for a user, including both individual exceptions and firm holidays
 */
export async function getUserBlockedDates(userId: string): Promise<BlockedDate[]> {
  const blockedDates: BlockedDate[] = [];

  try {
    // Get individual availability exceptions
    const { data: individualExceptions, error: individualError } = await supabase
      .from('availability_exceptions')
      .select('date, reason, is_blocked')
      .eq('user_id', userId)
      .eq('is_blocked', true);

    if (individualError) {
      console.error('Error fetching individual exceptions:', individualError);
    } else if (individualExceptions) {
      blockedDates.push(...individualExceptions.map(exc => ({
        date: exc.date,
        reason: exc.reason,
        source: 'individual' as const,
        is_blocked: exc.is_blocked
      })));
    }

    // Get user's firm ID
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('firm_id, role')
      .eq('user_id', userId)
      .single();

    if (teamError) {
      console.error('Error fetching team member:', teamError);
      return blockedDates;
    }

    // Only include firm holidays for lawyers, juniors, and paralegals
    if (teamMember && ['admin', 'lawyer', 'junior', 'paralegal'].includes(teamMember.role)) {
      // Get firm holidays
      const { data: firmHolidays, error: firmError } = await supabase
        .from('firm_holidays')
        .select('date, name, description')
        .eq('firm_id', teamMember.firm_id);

      if (firmError) {
        console.error('Error fetching firm holidays:', firmError);
      } else if (firmHolidays) {
        blockedDates.push(...firmHolidays.map(holiday => ({
          date: holiday.date,
          reason: holiday.name,
          source: 'firm_holiday' as const,
          is_blocked: true
        })));
      }
    }

    return blockedDates;
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return [];
  }
}

/**
 * Check if a specific date is blocked for a user
 */
export async function isDateBlocked(userId: string, date: Date): Promise<boolean> {
  const blockedDates = await getUserBlockedDates(userId);
  const targetDate = format(date, 'yyyy-MM-dd');
  
  return blockedDates.some(blocked => blocked.date === targetDate && blocked.is_blocked);
}

/**
 * Get firm holidays for a specific firm
 */
export async function getFirmHolidays(firmId: string): Promise<{
  id: string;
  date: string;
  name: string;
  description: string | null;
}[]> {
  try {
    const { data, error } = await supabase
      .from('firm_holidays')
      .select('id, date, name, description')
      .eq('firm_id', firmId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching firm holidays:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching firm holidays:', error);
    return [];
  }
}

/**
 * Check if a date is a firm holiday
 */
export async function isFirmHoliday(firmId: string, date: Date): Promise<boolean> {
  const holidays = await getFirmHolidays(firmId);
  const targetDate = format(date, 'yyyy-MM-dd');
  
  return holidays.some(holiday => holiday.date === targetDate);
}