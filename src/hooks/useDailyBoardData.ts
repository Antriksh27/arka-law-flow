import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyHearing, DailyBoardFilters } from '@/components/daily-board/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { formatAdvocatesFromParties } from '@/components/daily-board/utils';

export const useDailyBoardData = (
  selectedDate: Date,
  filters: DailyBoardFilters
) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['daily-hearings', format(selectedDate, 'yyyy-MM-dd'), filters, user?.id],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      let query = supabase
        .from('daily_hearings_view')
        .select('*')
        .eq('hearing_date', dateStr);
      
      // Apply filters
      if (filters.court && filters.court !== 'all') {
        query = query.eq('court_name', filters.court);
      }
      
      if (filters.judge && filters.judge !== 'all') {
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
      
      const hearings = (data || []) as DailyHearing[];
      
      if (hearings.length === 0) return hearings;
      
      // Get unique case IDs
      const caseIds = [...new Set(hearings.map(h => h.case_id))];
      
      // Batch fetch petitioners
      const { data: petitioners } = await supabase
        .from('petitioners')
        .select('case_id, advocate_name')
        .in('case_id', caseIds);
      
      // Batch fetch respondents
      const { data: respondents } = await supabase
        .from('respondents')
        .select('case_id, advocate_name')
        .in('case_id', caseIds);
      
      // Format advocates per case
      const aorpByCase = formatAdvocatesFromParties(petitioners || [], 'petitioner');
      const aorrByCase = formatAdvocatesFromParties(respondents || [], 'respondent');
      
      // Merge formatted data into hearings
      return hearings.map(h => ({
        ...h,
        formatted_aorp: aorpByCase[h.case_id] || '-',
        formatted_aorr: aorrByCase[h.case_id] || '-',
      }));
    },
  });
};
