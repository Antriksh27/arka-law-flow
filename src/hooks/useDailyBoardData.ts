import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyHearing, DailyBoardFilters } from '@/components/daily-board/types';
import { useAuth } from '@/contexts/AuthContext';

export const useDailyBoardData = (
  selectedDate: Date,
  filters: DailyBoardFilters
) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['daily-hearings', selectedDate.toISOString(), filters, user?.id],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      let query = supabase
        .from('daily_hearings_view')
        .select('*')
        .eq('hearing_date', dateStr);
      
      // Apply filters
      if (filters.court) {
        query = query.eq('court_name', filters.court);
      }
      
      if (filters.judge) {
        query = query.eq('judge', filters.judge);
      }
      
      if (filters.searchQuery) {
        query = query.or(`
          case_number.ilike.%${filters.searchQuery}%,
          petitioner.ilike.%${filters.searchQuery}%,
          respondent.ilike.%${filters.searchQuery}%,
          petitioner_advocate.ilike.%${filters.searchQuery}%,
          respondent_advocate.ilike.%${filters.searchQuery}%,
          advocate_name.ilike.%${filters.searchQuery}%
        `);
      }
      
      if (filters.myHearingsOnly && user?.id) {
        query = query.eq('assigned_to', user.id);
      }
      
      const { data, error } = await query.order('court_name').order('judge');
      
      if (error) throw error;
      
      return (data || []) as DailyHearing[];
    },
  });
};
