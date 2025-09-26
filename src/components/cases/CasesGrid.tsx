
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
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's role and firm membership
      const { data: userProfile } = await supabase
        .from('profiles')
        .select(`
          role,
          law_firm_members(role, law_firm_id)
        `)
        .eq('id', user.id)
        .single();

      // Check if user is admin or lawyer (can see all firm cases)
      const isAdminOrLawyer = userProfile?.role === 'admin' || 
                              userProfile?.role === 'lawyer' || 
                              userProfile?.role === 'partner' ||
                              userProfile?.role === 'associate' ||
                              userProfile?.role === 'junior';

      let query = supabase
        .from('case_details')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (!isAdminOrLawyer) {
        // Non-admin users only see cases they're assigned to
        query = query.or(`assigned_to.eq.${user.id},assigned_users.cs.{${user.id}}`);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,case_title.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%,petitioner.ilike.%${searchQuery}%,respondent.ilike.%${searchQuery}%,vs.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%,cnr_number.ilike.%${searchQuery}%,filing_number.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter as any);
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
