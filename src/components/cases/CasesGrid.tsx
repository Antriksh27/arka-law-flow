
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CaseCard } from './CaseCard';
import { Skeleton } from '@/components/ui/skeleton';

interface CasesGridProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  assignedFilter: string;
}

export const CasesGrid: React.FC<CasesGridProps> = ({
  searchQuery,
  statusFilter,
  typeFilter,
  assignedFilter
}) => {
  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases', searchQuery, statusFilter, typeFilter, assignedFilter],
    queryFn: async () => {
      let query = supabase
        .from('case_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No cases found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cases.map((caseItem) => (
        <CaseCard key={caseItem.id} case={caseItem} />
      ))}
    </div>
  );
};
