import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, AlertCircle } from 'lucide-react';

interface LegalkartHistoryTableProps {
  caseId: string;
}

export const LegalkartHistoryTable: React.FC<LegalkartHistoryTableProps> = ({ caseId }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['legalkart-history', caseId],
    queryFn: async (): Promise<any[]> => {
      try {
        const { data: legalkartCase } = await supabase
          .from('legalkart_cases')
          .select('id')
          .eq('case_id', caseId)
          .single();
        
        if (!legalkartCase) return [];
        
        const { data, error } = await supabase
          .from('legalkart_case_history')
          .select('*')
          .eq('case_id', legalkartCase.id) as any;
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!caseId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-8 w-8 text-muted mb-2" />
        <p className="text-muted">No hearing history found for this case</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        <AlertCircle className="w-4 h-4" />
        <span>{history.length} hearing(s) in history</span>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judge</TableHead>
              <TableHead>Hearing Date</TableHead>
              <TableHead>Cause List Type</TableHead>
              <TableHead>Business on Date</TableHead>
              <TableHead>Purpose of Hearing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((hearing) => (
              <TableRow key={hearing.id}>
                <TableCell className="font-medium">{hearing.judge || '-'}</TableCell>
                <TableCell>
                  {hearing.hearing_date 
                    ? new Date(hearing.hearing_date).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
                <TableCell>{hearing.cause_list_type || '-'}</TableCell>
                <TableCell>
                  {hearing.business_on_date 
                    ? new Date(hearing.business_on_date).toLocaleDateString()
                    : '-'
                  }
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="text-sm leading-relaxed">
                    {hearing.purpose_of_hearing || '-'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};