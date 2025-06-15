
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
      let query = supabase.from('case_details').select('*').order('created_at', {
        ascending: false
      });
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
  const getStatusBadgeVariant = (status: string): "info" | "warning" | "default" | "secondary" => {
    switch (status) {
      case 'open':
        return 'info';
      case 'in_court':
        return 'info';
      case 'on_hold':
        return 'warning';
      case 'closed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  const formatCaseType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  if (isLoading) {
    return <div className="text-center py-8">Loading cases...</div>;
  }
  return <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold text-foreground">Case Title</TableHead>
            <TableHead className="font-semibold text-foreground">Client</TableHead>
            <TableHead className="font-semibold text-foreground">Type</TableHead>
            <TableHead className="font-semibold text-foreground">Status</TableHead>
            <TableHead className="font-semibold text-foreground">Priority</TableHead>
            <TableHead className="font-semibold text-foreground">Created By</TableHead>
            <TableHead className="font-semibold text-foreground">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases?.map(caseItem => <TableRow key={caseItem.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/cases/${caseItem.id}`)}>
              <TableCell className="font-medium text-foreground">
                {caseItem.title}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {caseItem.client_name || 'No client assigned'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCaseType(caseItem.case_type)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(caseItem.status)} className="capitalize">
                  {caseItem.status?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="capitalize text-muted-foreground">
                {caseItem.priority}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-gray-100 text-muted-foreground">
                      {caseItem.created_by_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{caseItem.created_by_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(caseItem.updated_at), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};
