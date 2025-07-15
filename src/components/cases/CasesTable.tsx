
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
interface CasesTableProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  assignedFilter: string;
}
export const CasesTable: React.FC<CasesTableProps> = ({
  searchQuery,
  statusFilter,
  typeFilter,
  assignedFilter
}) => {
  const navigate = useNavigate();
  const {
    data: cases,
    isLoading
  } = useQuery({
    queryKey: ['cases-table', searchQuery, statusFilter, typeFilter, assignedFilter],
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

      let query = supabase.from('case_details').select('*').order('created_at', {
        ascending: false
      });

      // Apply role-based filtering
      if (!isAdminOrLawyer) {
        // Non-admin users only see cases they're assigned to
        query = query.or(`assigned_to.eq.${user.id},assigned_users.cs.{${user.id}}`);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter as any);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return data || [];
    }
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_court':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  const formatCaseType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  if (isLoading) {
    return <div className="text-center py-8">Loading cases...</div>;
  }
  return <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="bg-slate-800 text-white">Case Title</TableHead>
            <TableHead className="bg-slate-800 text-white">Client</TableHead>
            <TableHead className="bg-slate-800 text-white">Type</TableHead>
            <TableHead className="bg-slate-800 text-white">Status</TableHead>
            <TableHead className="bg-slate-800 text-white">Priority</TableHead>
            <TableHead className="bg-slate-800 text-white">Created By</TableHead>
            <TableHead className="bg-slate-800 text-white">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases?.map(caseItem => <TableRow key={caseItem.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/cases/${caseItem.id}`)}>
              <TableCell className="font-medium">
                {caseItem.title}
              </TableCell>
              <TableCell>
                {caseItem.client_name || 'No client assigned'}
              </TableCell>
              <TableCell>
                {formatCaseType(caseItem.case_type)}
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(caseItem.status)} rounded-full text-xs`}>
                  {caseItem.status?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="capitalize">{caseItem.priority}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-gray-100">
                      {caseItem.created_by_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{caseItem.created_by_name}</span>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(caseItem.updated_at), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};
