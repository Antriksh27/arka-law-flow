import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FirmLawyer {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string;
}

/**
 * Phase 9 perf: shared, cached lawyer roster for a firm.
 * All call sites should use this so React Query dedupes the request.
 *
 * Sorting convention: "chitrajeet upadhyaya" pinned first, then alpha.
 */
export const useFirmLawyers = (firmId: string | null | undefined, enabled = true) => {
  return useQuery({
    queryKey: ['firm-lawyers', firmId],
    queryFn: async (): Promise<FirmLawyer[]> => {
      if (!firmId) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, full_name, role')
        .eq('firm_id', firmId)
        .in('role', ['admin', 'lawyer', 'junior']);
      if (error) throw error;

      return (data || []).slice().sort((a, b) => {
        const nameA = a.full_name?.toLowerCase() || '';
        const nameB = b.full_name?.toLowerCase() || '';
        if (nameA.includes('chitrajeet upadhyaya')) return -1;
        if (nameB.includes('chitrajeet upadhyaya')) return 1;
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!firmId && enabled,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
